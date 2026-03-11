/**
 * File Name: dropdownService.js
 * Author: Naitik Maisuriya
 * Description: Service for fetching dynamic dropdown data used in user management forms.
 */

import api from "./api";

/**
 * Fetches data for a specific dropdown category from the backend.
 * @param {string} dropdownType - The type of data to retrieve.
 * @param {number} userId - The logged in user ID.
 * @param {number} projectId - Optional project ID for filtering.
 * @param {number} teamId - Optional team ID for filtering.
 */
export const fetchDropdown = async (dropdownType, userId = null, projectId = null, teamId = null) => {
     try {
          console.log(`[dropdownService] fetchDropdown called with:`, {
               dropdownType,
               userId,
               projectId,
               teamId
          });
          
          const payload = { dropdown_type: dropdownType };
          if (userId !== null && userId !== undefined) payload.logged_in_user_id = userId;
          if (projectId !== null && projectId !== undefined) payload.project_id = projectId;
          if (teamId !== null && teamId !== undefined) payload.team_id = teamId;
          
          console.log(`[dropdownService] API payload:`, payload);
          
          const response = await api.post("/dropdown/get", payload);
          const data = response.data?.data || [];
          console.log(`[dropdownService] Fetched ${dropdownType}:`, data.length, 'items');
          // Returns the data array or an empty array as a fallback
          return data;
     } catch (error) {
          console.error(`❌ Error fetching ${dropdownType}:`, error.response?.data || error.message);
          return [];
     }
};

/**
 * Executes concurrent API calls to retrieve all metadata required for user profiles.
 * Optimized with Promise.all for faster loading.
 * @param {number} userId - The logged in user ID.
 */
export const fetchUserDropdowns = async (userId = null) => {
     try {
          const [
               roles,
               designations,
               teams,
               projectManagers,
               assistantManagers,
               qas,
               agents,
               projectCategories,
          ] = await Promise.all([
               fetchDropdown("user roles", userId),
               fetchDropdown("designations", userId),
               fetchDropdown("teams", userId),
               fetchDropdown("project manager", userId),
               fetchDropdown("assistant manager", userId),
               fetchDropdown("qa", userId),
               fetchDropdown("agent", userId),
               fetchDropdown("project categories", userId),
          ]);

          const result = {
               roles,
               designations,
               teams,
               projectManagers,
               assistantManagers,
               qas,
               agents,
               projectCategories,
          };

          return result;
     } catch (error) {
          console.error("❌ Error fetching user dropdowns:", error);
          return {
               roles: [],
               designations: [],
               teams: [],
               projectManagers: [],
               assistantManagers: [],
               qas: [],
               agents: [],
               projectCategories: [],
          };
     }
};