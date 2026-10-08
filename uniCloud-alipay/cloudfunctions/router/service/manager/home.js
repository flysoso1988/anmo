'use strict';
let vk = uniCloud.vk; // 全局vk实例
// 涉及的表名
const dbName = require('../../dao/config.js');

const db = uniCloud.database(); // 全局数据库引用
const _ = db.command; // 数据库操作符
const $ = _.aggregate; // 聚合查询操作符
/**
 * 权限注意：访问以下链接查看
 * 文档地址：https://vkdoc.fsq.pub/client/uniCloud/cloudfunctions/cloudObject.html#内置权限
 */
const cloudObject = {
  isCloudObject: true, // 标记为云对象模式
  /**
   * 请求前处理，主要用于调用方法之前进行预处理，一般用于拦截器、统一的身份验证、参数校验、定义全局对象等。
   * 文档地址：https://vkdoc.fsq.pub/client/uniCloud/cloudfunctions/cloudObject.html#before-预处理
   */
  _before: async function () {
    vk = this.vk; // 将vk定义为全局对象
    // let { customUtil, uniID, config, pubFun } = this.getUtil(); // 获取工具包
  },
  /**
   * 请求后处理，主要用于处理本次调用方法的返回结果或者抛出的错误
   * 文档地址：https://vkdoc.fsq.pub/client/uniCloud/cloudfunctions/cloudObject.html#after-后处理
   */
  _after: async function (options) {
    let { err, res } = options;
    if (err) {
      if (err instanceof Error) {
        return; // 如果是Error类型，直接return;不处理
      }
      return err;
    }
    return res;
  },
  /**
   * 获取首页综合统计数据
   * @url manager/home.home 前端调用的url参数地址
   * @returns {Object} res.result 首页看板数据
   * @returns {number} res.result.todayRevenue - 今日营业额（元）
   * @returns {number} res.result.todayOrderCount - 今日开单数
   * @returns {Array} res.result.roomList - 房间列表（含关联的消费中订单）
   * @returns {Array} res.result.techList - 技师列表（含关联的上钟中消费明细）
   */
  home: async function (data) {
    let res = { code: 0, msg: '' };
    let { uid } = this.getClientInfo(); // 获取客户端信息
    // 业务逻辑开始-----------------------------------------------------------

    // 获取今日时间范围
    let { todayStart, todayEnd } = vk.pubfn.getCommonTime();

    // 并发执行所有查询
    let batchRunRes = await vk.pubfn.batchRun({
      main: [
        // 今日营业额
        async () => {
          return await vk.baseDao.sum({
            dbName: dbName.order,
            fieldName: 'pay_amount',
            whereJson: {
              status: _.in([1, 2]), // 消费中 + 已结账
              open_time: _.gte(todayStart).lte(todayEnd),
            },
          });
        },
        // 今日开单数
        async () => {
          return await vk.baseDao.count({
            dbName: dbName.order,
            whereJson: {
              open_time: _.gte(todayStart).lte(todayEnd),
            },
          });
        },
        // 房间列表（连表查询关联的消费中订单）
        async () => {
          return await vk.baseDao.selects({
            dbName: dbName.room,
            getCount: false,
            pageIndex: 1,
            pageSize: 1000,
            getMain: true,
            foreignDB: [
              {
                dbName: dbName.order,
                localKey: '_id',
                foreignKey: 'room_id',
                as: 'order',
                limit: 1,
                whereJson: {
                  status: 1, // 仅连表消费中的订单
                },
              },
            ],
          });
        },
        // 技师列表（连表查询关联的上钟中消费明细）
        async () => {
          return await vk.baseDao.selects({
            dbName: dbName.tech,
            getCount: false,
            pageIndex: 1,
            pageSize: 1000,
            getMain: true,
            foreignDB: [
              {
                dbName: dbName.orderItem,
                localKey: '_id',
                foreignKey: 'tech_id',
                as: 'orderItem',
                limit: 1,
                whereJson: {
                  status: 1, // 仅连表上钟中的明细
                },
              },
            ],
          });
        },
      ],
      concurrency: 10,
    });

    let stack = batchRunRes.stack;

    res.result = {
      todayRevenue: stack[0],
      todayOrderCount: stack[1],
      roomList: stack[2],
      techList: stack[3],
    };

    // 业务逻辑结束-----------------------------------------------------------
    return res;
  },
  /**
   * 获取列表
   * @url manager/home.getList 前端调用的url参数地址
   */
  getList: async function (data) {
    let res = { code: 0, msg: '' };
    let { uid } = this.getClientInfo(); // 获取客户端信息
    // 业务逻辑开始-----------------------------------------------------------

    // 业务逻辑结束-----------------------------------------------------------
    return res;
  },
  /**
   * 模板函数
   * @url manager/home.test 前端调用的url参数地址
   */
  test: async function (data) {
    let res = { code: 0, msg: '' };
    let { uid } = this.getClientInfo(); // 获取客户端信息
    // 业务逻辑开始-----------------------------------------------------------

    // 业务逻辑结束-----------------------------------------------------------
    return res;
  },
};

module.exports = cloudObject;
