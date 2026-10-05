'use strict';
let vk = uniCloud.vk;
const dbName = require('../../dao/config.js');

const db = uniCloud.database(); // 全局数据库引用
const _ = db.command; // 数据库操作符
const $ = _.aggregate; // 聚合查询操作符

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
   * 获取空闲技师列表
   * @url client/select.getStaffList
   */
  getStaffList: async function (data) {
    let res = { code: 0, msg: '' };
    let { uid } = this.getClientInfo();
    // 业务逻辑开始-----------------------------------------------------------
    res = await vk.baseDao.selects({
      dbName: dbName.user,
      getCount: false,
      pageIndex: 1,
      pageSize: 20,
      // 主表where条件
      whereJson: {
        role: 'staff',
      },
      // 主表字段显示规则
      fieldJson: {},
      // 主表排序规则
      sortArr: [{ name: '_id', type: 'desc' }],
      // 副表列表
      foreignDB: [
        {
          dbName: dbName.record,
          localKey: '_id',
          foreignKey: 'staff_id',
          as: 'record',
          whereJson: {
            start_time: _.lte(Date.now()),
            end_time: _.gte(Date.now()),
          },
          limit: 1,
        },
      ],
    });
    // 业务逻辑结束-----------------------------------------------------------
    return res;
  },

  /**
   * 获取空闲房间列表
   * @url client/select.getRoomList
   */
  getRoomList: async function (data) {
    let res = { code: 0, msg: '' };
    let { uid } = this.getClientInfo();
    // 业务逻辑开始-----------------------------------------------------------
    res = await vk.baseDao.selects({
      dbName: dbName.room,
      whereJson: { status: 0 },
      fieldJson: { _id: true, name: true, type: true },
      sortArr: [{ name: 'name', type: 'asc' }],
    });
    // 业务逻辑结束-----------------------------------------------------------
    return res;
  },

  /**
   * 获取启用的服务项目列表
   * @url client/select.getServiceList
   */
  getServiceList: async function (data) {
    let res = { code: 0, msg: '' };
    let { uid } = this.getClientInfo();
    // 业务逻辑开始-----------------------------------------------------------
    res = await vk.baseDao.select({
      dbName: dbName.service,
      whereJson: { status: true },
      fieldJson: { _id: true, name: true, price: true, duration: true },
      sortArr: [{ name: 'price', type: 'asc' }],
    });
    // 业务逻辑结束-----------------------------------------------------------
    return res;
  },

  /**
   * 获取首页房间和技师列表
   * @url client/select.getHomeList
   */
  getHomeList: async function (data) {
    let res = { code: 0, msg: '' };
    let { uid } = this.getClientInfo();
    // 业务逻辑开始-----------------------------------------------------------
    let [roomResult, staffResult, activeRecords] = await Promise.all([
      vk.baseDao.select({
        dbName: dbName.room,
        sortArr: [{ name: 'name', type: 'asc' }],
      }),
      vk.baseDao.select({
        dbName: dbName.staff,
        sortArr: [{ name: 'name', type: 'asc' }],
      }),
      // 查询所有进行中的记录，用于填充房间的技师和结束时间
      vk.baseDao.select({
        dbName: dbName.record,
        whereJson: { status: 0 },
        fieldJson: { _id: true, room_id: true, staff_name: true, end_time: true },
      }),
    ]);
    // 建立 room_id -> 进行中记录 的映射
    let activeRecordMap = {};
    (activeRecords.rows || []).forEach((record) => {
      activeRecordMap[record.room_id] = record;
    });
    // 合并进行中记录的数据到房间对象
    let roomList = roomResult.rows.map((room) => {
      let active = activeRecordMap[room._id];
      if (active) {
        room.technician = active.staff_name;
        room.end_time = active.end_time;
        room.record_id = active._id;
      }
      return room;
    });
    res.roomList = roomList;
    res.staffList = staffResult.rows;
    // 业务逻辑结束-----------------------------------------------------------
    return res;
  },
};

module.exports = cloudObject;
