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
    log(
      `[QC Service] Saving temp QC for user ${payload.user_id} on ${payload.date}`,
    );

    console.log("[QC Service] Request payload:", payload);

    const response = await api.post("/qc/temp-qc", payload);

    log(`[QC Service] Temp QC saved successfully:`, response.data);
    return response.data;
  } catch (error) {
    logError("[QC Service] Error saving temp QC:", error);
    console.error("[QC Service] Error details:", {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
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
    log(
      `[QC Service] Fetching AFD for project category ${project_category_id}`,
    );

    const response = await api.post("/project_category/list", {
      project_category_id,
    });

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
      logged_in_user_id,
    });

    log(`[QC Service] Sample generated successfully:`, response.data);
    log(`[QC Service] Full response structure:`, JSON.stringify(response.data, null, 2));
    log(`[QC Service] File path check:`, {
      'response.data.file_path': response.data?.file_path,
      'response.data["10%_file_path"]': response.data?.['10%_file_path'],
      'response.data.data.file_path': response.data?.data?.file_path,
      'response.data.data["10%_file_path"]': response.data?.data?.['10%_file_path']
    });
    return response.data;
  } catch (error) {
    logError("[QC Service] Error generating QC sample:", error);
    throw error;
  }
};

/**
 * Save QC Form Record
 * @param {Object} payload - Complete QC form data payload
 * @param {number} payload.logged_in_user_id - Logged in user ID (for authentication)
 * @param {number} payload.tracker_id - Tracker ID reference
 * @param {number|null} payload.ass_manager_id - Assistant Manager ID
 * @param {number} payload.qc_user_id - QA User ID (who performed the QC)
 * @param {number} payload.agent_user_id - Agent User ID (whose work is being checked)
 * @param {number} payload.project_id - Project ID
 * @param {number} payload.task_id - Task ID
 * @param {string} payload.file_path - File path/URL
 * @param {string} payload.date_of_file_submission - Date of file submission (YYYY-MM-DD)
 * @param {number} payload.qc_score - Final QC Score (0-100)
 * @param {string} payload.status - Status (Approved/Rework/Correction)
 * @param {number} payload.file_record_count - Total records in file
 * @param {number} payload.data_generated_count - 10% data generated count
 * @param {number} payload.qc_file_records - 10% QC file records count
 * @param {number} payload.error_score - Error score (100 - qc_score)
 * @param {Array} payload.error_list - List of errors with category, subcategory, row, points
 * @param {string} payload.comments - QC comments
 * @returns {Promise} Response data
 */
export const saveQCRecord = async (payload) => {
  try {
    log(`[QC Service] Saving QC record for tracker ${payload.tracker_id}`);
    console.log('[QC Service] Payload structure:', {
      logged_in_user_id: payload.logged_in_user_id,
      tracker_id: payload.tracker_id,
      ass_manager_id: payload.ass_manager_id,
      qc_user_id: payload.qc_user_id,
      agent_user_id: payload.agent_user_id,
      project_id: payload.project_id,
      task_id: payload.task_id,
      date_of_file_submission: payload.date_of_file_submission,
      qc_score: payload.qc_score,
      status: payload.status,
      file_record_count: payload.file_record_count,
      data_generated_count: payload.data_generated_count,
      qc_file_records: payload.qc_file_records,
      error_score: payload.error_score,
      error_list_length: payload.error_list?.length || 0,
      has_comments: !!payload.comments
    });

    const response = await nodeApi.post("/qc-records/save", payload);

    log(`[QC Service] QC record saved successfully:`, response.data);
    return response.data;
  } catch (error) {
    logError("[QC Service] Error saving QC record:", error);
    console.error("[QC Service] Error details:", {
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
      data: error.response?.data
    });
    throw error;
  }
};

/**
 * Fetch QC Form Records
 * @param {number|null} logged_in_user_id - Optional user ID to filter records for agent view
 * @returns {Promise} List of QC records
 */
export const getQCRecordsList = async (logged_in_user_id = null) => {
  try {
    log(`[QC Service] Fetching QC records list`);

    // Construct query params if logged_in_user_id is provided
    const url = logged_in_user_id
      ? `/qc-records/list?logged_in_user_id=${logged_in_user_id}`
      : "/qc-records/list";

    const response = await nodeApi.get(url);

    log(`[QC Service] QC records fetched successfully:`, response.data);
    return response.data;
  } catch (error) {
    logError("[QC Service] Error fetching QC records:", error);
    throw error;
  }
};
