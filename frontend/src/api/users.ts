import client from "./client";

import {
  User,
  UserUpdate,
  UserAdminUpdate,
  PasswordUpdate,
  UserRole,
} from "../types";

export const usersApi = {
  // --------------------------------------------------
  // Current user
  // --------------------------------------------------

  getMe: async (): Promise<User> => {
    const response =
      await client.get<User>(
        "/api/users/me"
      );

    return response.data;
  },

  // --------------------------------------------------
  // Update current user
  // --------------------------------------------------

  updateMe: async (
    data: UserUpdate
  ): Promise<User> => {
    const response =
      await client.put<User>(
        "/api/users/me",
        data
      );

    return response.data;
  },

  // --------------------------------------------------
  // Change password
  // --------------------------------------------------

  updatePassword: async (
    data: PasswordUpdate
  ): Promise<void> => {
    await client.put(
      "/api/users/me/password",
      data
    );
  },

  // --------------------------------------------------
  // List all users
  // Administrator only
  // --------------------------------------------------

  listUsers: async (
    skip = 0,
    limit = 100
  ): Promise<User[]> => {
    const response =
      await client.get<User[]>(
        "/api/users/",
        {
          params: {
            skip,
            limit,
          },
        }
      );

    return response.data;
  },

  // --------------------------------------------------
  // Get one user
  // --------------------------------------------------

  getUser: async (
    id: number
  ): Promise<User> => {
    const response =
      await client.get<User>(
        `/api/users/${id}`
      );

    return response.data;
  },

  // --------------------------------------------------
  // Admin update user
  // --------------------------------------------------

  updateUser: async (
    id: number,
    data: UserAdminUpdate
  ): Promise<User> => {
    const response =
      await client.put<User>(
        `/api/users/${id}`,
        data
      );

    return response.data;
  },

  // --------------------------------------------------
  // Change role
  // --------------------------------------------------

  updateRole: async (
    id: number,
    role: UserRole
  ): Promise<User> => {
    const response =
      await client.patch<User>(
        `/api/users/${id}/role`,
        {
          role,
        }
      );

    return response.data;
  },

  // --------------------------------------------------
  // Delete user
  // --------------------------------------------------

  deleteUser: async (
    id: number
  ): Promise<void> => {
    await client.delete(
      `/api/users/${id}`
    );
  },

  // --------------------------------------------------
  // Get reviewers
  //
  // IMPORTANT:
  // Use /reviewers instead of /users/
  // because /users/ is Administrator-only.
  // --------------------------------------------------

  getReviewers: async (): Promise<User[]> => {
    const response =
      await client.get<User[]>(
        "/api/users/reviewers"
      );

    console.log(
      "Reviewers received from API:",
      response.data
    );

    return response.data;
  },
};