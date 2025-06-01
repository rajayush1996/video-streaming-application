const asyncLocalStorage = require('../../context');
const AuditLog = require('../auditLog.model');

async function logAudit(entry) {
    try {
        await AuditLog.create(entry);
    } catch (err) {
        console.error('Audit log failed:', err);
    }
}

function getAuditContext() {
    return asyncLocalStorage.getStore() || {};
}

function auditPlugin(schema, options = {}) {
    // CREATE/UPDATE
    schema.pre('save', async function(next) {
        const ctx = getAuditContext();
        if (!ctx.userId) return next();

        if (this.isNew) {
            await logAudit({
                action: 'CREATE',
                userId: ctx.userId,
                ipAddress: ctx.ip,
                userAgent: ctx.userAgent,
                resourceType: options.resourceType || this.constructor.modelName,
                resourceId: this._id,
                details: { after: this.toObject() },
                status: 'SUCCESS',
                timestamp: new Date(),
            });
        } else {
            const original = await this.constructor.findById(this._id).lean();
            await logAudit({
                action: 'UPDATE',
                userId: ctx.userId,
                ipAddress: ctx.ip,
                userAgent: ctx.userAgent,
                resourceType: options.resourceType || this.constructor.modelName,
                resourceId: this._id,
                details: { before: original, after: this.toObject() },
                status: 'SUCCESS',
                timestamp: new Date(),
            });
        }
        next();
    });

    // UPDATE via findOneAndUpdate
    schema.pre('findOneAndUpdate', async function(next) {
        const ctx = getAuditContext();
        if (!ctx.userId) return next();

        const filter = this.getQuery();
        const original = await this.model.findOne(filter).lean();
        const update = this.getUpdate();
        const newData = { ...original, ...(update.$set || {}) };

        await logAudit({
            action: 'UPDATE',
            userId: ctx.userId,
            ipAddress: ctx.ip,
            userAgent: ctx.userAgent,
            resourceType: options.resourceType || this.model.modelName,
            resourceId: original?._id,
            details: { before: original, after: newData },
            status: 'SUCCESS',
            timestamp: new Date(),
        });

        next();
    });

    // DELETE via findOneAndDelete
    schema.pre('findOneAndDelete', async function(next) {
        const ctx = getAuditContext();
        if (!ctx.userId) return next();

        const docToDelete = await this.model.findOne(this.getQuery()).lean();
        if (!docToDelete) return next();

        await logAudit({
            action: 'DELETE',
            userId: ctx.userId,
            ipAddress: ctx.ip,
            userAgent: ctx.userAgent,
            resourceType: options.resourceType || this.model.modelName,
            resourceId: docToDelete._id,
            details: { before: docToDelete },
            status: 'SUCCESS',
            timestamp: new Date(),
        });

        next();
    });
}

module.exports = auditPlugin; 