'use strict';
let vk = uniCloud.vk;
const dbName = require('../../dao/config.js');

const cloudObject = {
  isCloudObject: true,

  _before: async function () {
    vk = this.vk;
  },

  _after: async function (options) {
    let { err, res } = options;
    if (err) {
      if (err instanceof Error) {
        return;
      }
      return err;
    }
    return res;
  },

  /**
   * 获取概览统计
   * @url client/stat.getOverview
   */
  getOverview: async function (data) {
    let res = { code: 0, msg: '' };
    let { uid } = this.getClientInfo();
    // 业务逻辑开始-----------------------------------------------------------
    // 获取今日开始时间
    let today = new Date();
    today.setHours(0, 0, 0, 0);

    // 并行查询所有数据
    let [staffResult, roomResult, activeCount, allRecordsResult] = await Promise.all([
      // 技师统计
      vk.baseDao.select({
        dbName: dbName.staff,
        whereJson: {},
      }),
      // 房间统计
      vk.baseDao.select({
        dbName: dbName.room,
        whereJson: {},
      }),
      // 进行中的上钟数
      vk.baseDao.count({
        dbName: dbName.record,
        whereJson: { status: 0 },
      }),
      // 所有记录
      vk.baseDao.select({
        dbName: dbName.record,
        whereJson: {},
      }),
    ]);

    // 处理技师统计
    let staffStats = { total: 0, free: 0, busy: 0, off: 0 };
    staffResult.rows.forEach((item) => {
      staffStats.total++;
      if (item.status === 0) staffStats.free++;
      else if (item.status === 1) staffStats.busy++;
      else if (item.status === 2) staffStats.off++;
    });

    // 处理房间统计
    let roomStats = { total: 0, free: 0, busy: 0, maintenance: 0 };
    roomResult.rows.forEach((item) => {
      roomStats.total++;
      if (item.status === 0) roomStats.free++;
      else if (item.status === 1) roomStats.busy++;
      else if (item.status === 2) roomStats.maintenance++;
    });

    // 分类统计记录
    let allRecords = allRecordsResult.rows;
    let activeRecords = [];      // 进行中
    let todayCompleted = [];     // 今日已完成
    let todayEstimated = [];     // 今日相关（进行中 + 已完成）

    allRecords.forEach((item) => {
      if (item.status === 0) {
        // 进行中的记录
        activeRecords.push(item);
        todayEstimated.push(item);
      } else if (item.status === 1 || item.status === 2) {
        // 已完成/已支付的记录，判断是否今日下钟
        let endTime = item.actual_end_time || item.end_time;
        let endDate = new Date(endTime);
        if (endDate >= today) {
          todayCompleted.push(item);
          todayEstimated.push(item);
        }
      }
    });

    // 处理今日统计
    let todayStats = {
      count: todayEstimated.length,
      estimatedRevenue: 0,
      actualRevenue: 0,
      completedCount: todayCompleted.length,
      duration: 0,
    };
    // 预计营收 = 今日已完成 + 当前进行中
    todayEstimated.forEach((item) => {
      todayStats.estimatedRevenue += item.price || 0;
      todayStats.duration += item.duration || 0;
    });
    // 实际营收 = 今日已完成
    todayCompleted.forEach((item) => {
      todayStats.actualRevenue += item.price || 0;
    });

    // 返回数据
    res.data = {
      staff: staffStats,
      room: roomStats,
      activeCount: activeCount,
      today: todayStats,
    };
    // 业务逻辑结束-----------------------------------------------------------
    return res;
  },
};

module.exports = cloudObject;
