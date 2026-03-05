/**
 * File Name: qcService.js
 * Author: Naitik Maisuriya
 * Description: API service for QC (Quality Control) operations
 */

import api from "./api";
import nodeApi from "./nodeApi";
import { log, logError } from "../config/environment";

/**
 * Save temporary QC data for a user
 * @param {Object} payload - Request payload containing user_id, date, and optional assigned_hours and qc_score
 * @returns {Promise} Response data
 */
export const saveTempQC = async (payload) => {
  try {
    log(`[QC Service] Saving temp QC for user ${payload.user_id} on ${payload.date}`);
    
    console.log('[QC Service] Request payload:', payload);
    
    const response = await api.post("/qc/temp-qc", payload);
    
    log(`[QC Service] Temp QC saved successfully:`, response.data);
    return response.data;
  } catch (error) {
    logError("[QC Service] Error saving temp QC:", error);
    console.error('[QC Service] Error details:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    throw error;
  }
};

/**
 * Fetch AFD (Attribute/Feature/Defect) data for a project category
 * @param {number} project_category_id - Project category ID
 * @returns {Promise} AFD data with categories and subcategories
 */
export const fetchProjectCategoryAFD = async (project_category_id) => {
  try {
    log(`[QC Service] Fetching AFD for project category ${project_category_id}`);
    
    const response = await api.post("/project_category/list", { project_category_id });
    
    log(`[QC Service] AFD data fetched successfully:`, response.data);
    return response.data;
  } catch (error) {
    logError("[QC Service] Error fetching project category AFD:", error);
    throw error;
  }
};

/**
 * Fetch QC AFD (Attribute/Feature/Defect) list from Node API
 * @returns {Promise} AFD data with categories and subcategories
 */
export const fetchQCAFDList = async () => {
  try {
    log(`[QC Service] Fetching QC AFD list from Node API`);
    
    const response = await nodeApi.get("/qc-afd/list");
    
    log(`[QC Service] QC AFD data fetched successfully:`, response.data);
    return response.data;
  } catch (error) {
    logError("[QC Service] Error fetching QC AFD list:", error);
    throw error;
  }
};

/**
 * Generate 10% sample data from tracker file
 * @param {number} tracker_id - Tracker ID
 * @param {number} logged_in_user_id - Logged in user ID
 * @returns {Promise} Sample data response with file URL and records
 */
export const generateQCSample = async (tracker_id, logged_in_user_id) => {
  try {
    log(`[QC Service] Generating sample for tracker ${tracker_id}`);
    
    const response = await nodeApi.post("/qc-records/generate-sample", {
      tracker_id,
      logged_in_user_id
    });
    
    log(`[QC Service] Sample generated successfully:`, response.data);
    return response.data;
  } catch (error) {
    logError("[QC Service] Error generating QC sample:", error);
    throw error;
  }
};

/**
 * Save QC record to database
 * @param {Object} payload - QC record data
 * @returns {Promise} Save response
 */
export const saveQCRecord = async (payload) => {
  try {
    log(`[QC Service] Saving QC record for agent ${payload.agent_user_id}`);
    console.log('[QC Service] Full payload:', JSON.stringify(payload, null, 2));
    
    const response = await nodeApi.post("/qc-records/save", payload);
    
    console.log('[QC Service] Response status:', response.status);
    console.log('[QC Service] Response data:', response.data);
    
    log(`[QC Service] QC record saved successfully:`, response.data);
    return response.data;
  } catch (error) {
    console.error("[QC Service] Error saving QC record:", error);
    console.error("[QC Service] Error response:", error.response?.data);
    console.error("[QC Service] Error status:", error.response?.status);
    logError("[QC Service] Error saving QC record:", error);
    throw error;
  }
};
