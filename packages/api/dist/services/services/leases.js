"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeasesService = void 0;
const client_1 = require("../client");
class LeasesService {
    /**
     * Get all leases
     */
    static async getAll() {
        return (0, client_1.createApiResponse)([], null);
    }
    /**
     * Update a lease
     */
    static async update(id, leaseData) {
        return (0, client_1.createApiResponse)(null, 'Not implemented');
    }
}
exports.LeasesService = LeasesService;
