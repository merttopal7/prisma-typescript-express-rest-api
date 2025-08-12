import { Prisma } from "../models/base.models";

export type roleType = {
    id: number;
    roleId: number;
    model: string;
    canCreate: boolean;
    canRead: boolean;
    canUpdate: boolean;
    canDelete: boolean;
}
export type permission = {
    [key: string]: roleType;
};
export type PermissionMap = {
    [key: string]: permission;
};

export class RoleManager {
    static notFoundRole: roleType = { id: 0, roleId: 0, model: 'notFound', canCreate: false, canRead: false, canUpdate: false, canDelete: false }
    static roles: PermissionMap = {};
    static userRoles: any = {}
    
    static save(role: roleType) {
        if (!RoleManager.roles[role.roleId]) RoleManager.roles[role.roleId] = {}
        RoleManager.roles[role.roleId][role.model] = role;
    }

    static async can(userId: number, action: string) {
        let roleId = RoleManager.userRoles[userId];
        if (!roleId) {
            const { prisma, query } = Prisma;
            const user = await query(prisma.user.findUnique({ where: { id: userId } }))
            if (user.error) return RoleManager.notFoundRole;
            roleId = user.data?.roleId ?? 0;
            RoleManager.userRoles[userId] = roleId;
        }
        if (!RoleManager.roles[roleId]) return RoleManager.notFoundRole;
        return RoleManager.roles[roleId][action]
    }
}