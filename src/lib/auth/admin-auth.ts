/**
 * Admin Authentication and Authorization Service
 * Provides utilities for admin user validation, permissions, and role management
 */

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export type AdminRole = 'super_admin' | 'admin' | 'moderator'

export interface AdminUser {
  id: string
  userId: string
  email: string
  fullName?: string
  role: AdminRole
  permissions: Record<string, boolean>
  isActive: boolean
  lastLogin?: Date
  createdAt: Date
  updatedAt: Date
}

export interface AdminPermissions {
  'videos.create': boolean
  'videos.edit': boolean
  'videos.delete': boolean
  'videos.view': boolean
  'playlists.create': boolean
  'playlists.edit': boolean
  'playlists.delete': boolean
  'playlists.view': boolean
  'queue.manage': boolean
  'queue.view': boolean
  'queue.retry': boolean
  'queue.cancel': boolean
  'analytics.view': boolean
  'analytics.export': boolean
  'logs.view': boolean
  'logs.delete': boolean
  'users.manage': boolean
  'users.view': boolean
  'system.settings': boolean
  'system.maintenance': boolean
}

// Default permissions for each role
export const defaultPermissions: Record<AdminRole, Partial<AdminPermissions>> = {
  super_admin: {
    'videos.create': true,
    'videos.edit': true,
    'videos.delete': true,
    'videos.view': true,
    'playlists.create': true,
    'playlists.edit': true,
    'playlists.delete': true,
    'playlists.view': true,
    'queue.manage': true,
    'queue.view': true,
    'queue.retry': true,
    'queue.cancel': true,
    'analytics.view': true,
    'analytics.export': true,
    'logs.view': true,
    'logs.delete': true,
    'users.manage': true,
    'users.view': true,
    'system.settings': true,
    'system.maintenance': true
  },
  admin: {
    'videos.create': true,
    'videos.edit': true,
    'videos.delete': true,
    'videos.view': true,
    'playlists.create': true,
    'playlists.edit': true,
    'playlists.delete': false,
    'playlists.view': true,
    'queue.manage': true,
    'queue.view': true,
    'queue.retry': true,
    'queue.cancel': true,
    'analytics.view': true,
    'analytics.export': false,
    'logs.view': true,
    'logs.delete': false,
    'users.manage': false,
    'users.view': true,
    'system.settings': false,
    'system.maintenance': false
  },
  moderator: {
    'videos.create': true,
    'videos.edit': true,
    'videos.delete': false,
    'videos.view': true,
    'playlists.create': false,
    'playlists.edit': false,
    'playlists.delete': false,
    'playlists.view': true,
    'queue.manage': false,
    'queue.view': true,
    'queue.retry': false,
    'queue.cancel': false,
    'analytics.view': true,
    'analytics.export': false,
    'logs.view': true,
    'logs.delete': false,
    'users.manage': false,
    'users.view': false,
    'system.settings': false,
    'system.maintenance': false
  }
}

export class AdminAuthService {
  private supabase = createClientComponentClient()

  /**
   * Check if current user is an admin
   */
  async isAdmin(userId?: string): Promise<boolean> {
    try {
      if (!userId) {
        const { data: { session } } = await this.supabase.auth.getSession()
        if (!session) return false
        userId = session.user.id
      }

      const { data } = await this.supabase
        .rpc('is_admin', { user_uuid: userId })

      return !!data
    } catch (error) {
      console.error('Error checking admin status:', error)
      return false
    }
  }

  /**
   * Get admin user details
   */
  async getAdminUser(userId?: string): Promise<AdminUser | null> {
    try {
      if (!userId) {
        const { data: { session } } = await this.supabase.auth.getSession()
        if (!session) return null
        userId = session.user.id
      }

      const { data, error } = await this.supabase
        .from('admin_users')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .single()

      if (error || !data) return null

      return {
        id: data.id,
        userId: data.user_id,
        email: data.email,
        fullName: data.full_name,
        role: data.role,
        permissions: data.permissions || defaultPermissions[data.role as AdminRole],
        isActive: data.is_active,
        lastLogin: data.last_login ? new Date(data.last_login) : undefined,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      }
    } catch (error) {
      console.error('Error getting admin user:', error)
      return null
    }
  }

  /**
   * Get admin role for user
   */
  async getAdminRole(userId?: string): Promise<AdminRole | null> {
    try {
      if (!userId) {
        const { data: { session } } = await this.supabase.auth.getSession()
        if (!session) return null
        userId = session.user.id
      }

      const { data } = await this.supabase
        .rpc('get_admin_role', { user_uuid: userId })

      return data as AdminRole | null
    } catch (error) {
      console.error('Error getting admin role:', error)
      return null
    }
  }

  /**
   * Check if user has specific permission
   */
  async hasPermission(
    permission: keyof AdminPermissions,
    userId?: string
  ): Promise<boolean> {
    try {
      const adminUser = await this.getAdminUser(userId)
      if (!adminUser) return false

      return !!(adminUser.permissions[permission])
    } catch (error) {
      console.error('Error checking permission:', error)
      return false
    }
  }

  /**
   * Check if user has any of the specified permissions
   */
  async hasAnyPermission(
    permissions: (keyof AdminPermissions)[],
    userId?: string
  ): Promise<boolean> {
    try {
      const adminUser = await this.getAdminUser(userId)
      if (!adminUser) return false

      return permissions.some(perm => adminUser.permissions[perm])
    } catch (error) {
      console.error('Error checking permissions:', error)
      return false
    }
  }

  /**
   * Check if user has all of the specified permissions
   */
  async hasAllPermissions(
    permissions: (keyof AdminPermissions)[],
    userId?: string
  ): Promise<boolean> {
    try {
      const adminUser = await this.getAdminUser(userId)
      if (!adminUser) return false

      return permissions.every(perm => adminUser.permissions[perm])
    } catch (error) {
      console.error('Error checking permissions:', error)
      return false
    }
  }

  /**
   * Update admin user's last login time
   */
  async updateLastLogin(userId?: string): Promise<void> {
    try {
      if (!userId) {
        const { data: { session } } = await this.supabase.auth.getSession()
        if (!session) return
        userId = session.user.id
      }

      await this.supabase
        .from('admin_users')
        .update({ last_login: new Date().toISOString() })
        .eq('user_id', userId)
    } catch (error) {
      console.error('Error updating last login:', error)
    }
  }

  /**
   * Log admin activity
   */
  async logActivity(
    action: string,
    resourceType?: string,
    resourceId?: string,
    oldValues?: any,
    newValues?: any,
    details?: any
  ): Promise<void> {
    try {
      const { data: { session } } = await this.supabase.auth.getSession()
      if (!session) return

      const adminUser = await this.getAdminUser(session.user.id)
      if (!adminUser) return

      await this.supabase.rpc('log_admin_activity', {
        admin_user_id: adminUser.id,
        action_name: action,
        resource_type_param: resourceType,
        resource_id_param: resourceId,
        old_values_param: oldValues,
        new_values_param: newValues,
        details_param: details,
        ip_address_param: null, // Will be populated by server
        user_agent_param: typeof navigator !== 'undefined' ? navigator.userAgent : null,
        session_id_param: session.access_token
      })
    } catch (error) {
      console.error('Error logging admin activity:', error)
    }
  }

  /**
   * Create new admin user
   */
  async createAdminUser(
    userId: string,
    email: string,
    role: AdminRole,
    fullName?: string,
    customPermissions?: Partial<AdminPermissions>
  ): Promise<AdminUser | null> {
    try {
      const permissions = {
        ...defaultPermissions[role],
        ...customPermissions
      }

      const { data, error } = await this.supabase
        .from('admin_users')
        .insert({
          user_id: userId,
          email,
          role,
          full_name: fullName,
          permissions,
          is_active: true
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating admin user:', error)
        return null
      }

      await this.logActivity('admin_user_created', 'admin_user', data.id, null, {
        email,
        role,
        fullName
      })

      return {
        id: data.id,
        userId: data.user_id,
        email: data.email,
        fullName: data.full_name,
        role: data.role,
        permissions: data.permissions,
        isActive: data.is_active,
        lastLogin: data.last_login ? new Date(data.last_login) : undefined,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      }
    } catch (error) {
      console.error('Error creating admin user:', error)
      return null
    }
  }

  /**
   * Update admin user role and permissions
   */
  async updateAdminUser(
    adminUserId: string,
    updates: {
      role?: AdminRole
      fullName?: string
      permissions?: Partial<AdminPermissions>
      isActive?: boolean
    }
  ): Promise<boolean> {
    try {
      const { data: currentData } = await this.supabase
        .from('admin_users')
        .select('*')
        .eq('id', adminUserId)
        .single()

      if (!currentData) return false

      const newPermissions = updates.role
        ? { ...defaultPermissions[updates.role], ...updates.permissions }
        : { ...currentData.permissions, ...updates.permissions }

      const { error } = await this.supabase
        .from('admin_users')
        .update({
          ...updates,
          permissions: newPermissions,
          updated_at: new Date().toISOString()
        })
        .eq('id', adminUserId)

      if (error) {
        console.error('Error updating admin user:', error)
        return false
      }

      await this.logActivity('admin_user_updated', 'admin_user', adminUserId, currentData, {
        ...updates,
        permissions: newPermissions
      })

      return true
    } catch (error) {
      console.error('Error updating admin user:', error)
      return false
    }
  }

  /**
   * Deactivate admin user
   */
  async deactivateAdminUser(adminUserId: string): Promise<boolean> {
    return this.updateAdminUser(adminUserId, { isActive: false })
  }

  /**
   * Activate admin user
   */
  async activateAdminUser(adminUserId: string): Promise<boolean> {
    return this.updateAdminUser(adminUserId, { isActive: true })
  }

  /**
   * Get all admin users
   */
  async getAllAdminUsers(): Promise<AdminUser[]> {
    try {
      const { data, error } = await this.supabase
        .from('admin_users')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error getting admin users:', error)
        return []
      }

      return data.map(item => ({
        id: item.id,
        userId: item.user_id,
        email: item.email,
        fullName: item.full_name,
        role: item.role,
        permissions: item.permissions || defaultPermissions[item.role as AdminRole],
        isActive: item.is_active,
        lastLogin: item.last_login ? new Date(item.last_login) : undefined,
        createdAt: new Date(item.created_at),
        updatedAt: new Date(item.updated_at)
      }))
    } catch (error) {
      console.error('Error getting admin users:', error)
      return []
    }
  }
}

// Create singleton instance
export const adminAuth = new AdminAuthService()

// Utility functions for permissions checking
export const checkPermission = (permission: keyof AdminPermissions, userId?: string) =>
  adminAuth.hasPermission(permission, userId)

export const checkAnyPermission = (permissions: (keyof AdminPermissions)[], userId?: string) =>
  adminAuth.hasAnyPermission(permissions, userId)

export const checkAllPermissions = (permissions: (keyof AdminPermissions)[], userId?: string) =>
  adminAuth.hasAllPermissions(permissions, userId)

export const requireAdmin = async (userId?: string): Promise<boolean> => {
  return adminAuth.isAdmin(userId)
}

export const requirePermission = async (permission: keyof AdminPermissions, userId?: string): Promise<boolean> => {
  return adminAuth.hasPermission(permission, userId)
}

export const requireRole = async (role: AdminRole, userId?: string): Promise<boolean> => {
  const userRole = await adminAuth.getAdminRole(userId)
  return userRole === role
}

export const requireMinRole = async (minRole: AdminRole, userId?: string): Promise<boolean> => {
  const userRole = await adminAuth.getAdminRole(userId)
  if (!userRole) return false
  
  const roleHierarchy: Record<AdminRole, number> = {
    moderator: 1,
    admin: 2,
    super_admin: 3
  }
  
  return roleHierarchy[userRole] >= roleHierarchy[minRole]
}