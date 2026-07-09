import request from "./request";

/**
 * 提交问卷数据
 * @param {Object} questionnaireData 问卷数据
 * @returns {Promise}
 */
export function submitQuestionnaire(questionnaireData) {
  return request({
    url: "/questionnaire",
    method: "post",
    data: questionnaireData,
  });
}

export function getHobbyOptions() {
  return request({
    url: "/questionnaire/hobby-options",
    method: "get",
  });
}

/**
 * @param {Number} userId 用户ID（可选，如果不提供则获取当前登录用户的问卷）
 * @returns {Promise}
 */
export function getQuestionnaire(userId = null) {
  const url = userId ? `/questionnaire/${userId}` : "/questionnaire";
  return request({
    url,
    method: "get",
  });
}

/**
 * 获取指定用户的公开问卷信息（仅包含兴趣爱好等可公开信息）
 * @param {Number} userId 用户ID
 * @returns {Promise}
 */
export function getPublicQuestionnaire(userId) {
  return request({
    url: `/questionnaire/${userId}/public`,
    method: "get",
  });
}

/**
 * 更新问卷数据（用于自动保存和部分更新）
 * @param {Object} questionnaireData 问卷数据
 * @returns {Promise}
 */
export function updateQuestionnaire(questionnaireData) {
  return request({
    url: "/questionnaire",
    method: "put",
    data: questionnaireData,
  });
}

/**
 * 删除问卷数据
 * @returns {Promise}
 */
export function deleteQuestionnaire() {
  return request({
    url: "/questionnaire",
    method: "delete",
  });
}

const questionnaireApi = {
  submitQuestionnaire,
  getHobbyOptions,
  getQuestionnaire,
  getPublicQuestionnaire,
  updateQuestionnaire,
  deleteQuestionnaire,
};

export default questionnaireApi;


