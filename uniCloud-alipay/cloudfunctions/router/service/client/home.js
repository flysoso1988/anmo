'use strict';
let vk = uniCloud.vk;
const dbName = require('../../dao/config.js');

const db = uniCloud.database();
const _ = db.command;
const $ = _.aggregate;

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
   * 获取首页数据（合并房间列表、技师列表和今日营收统计）
   * @url client/home.getHome
   */
  getHome: async function (data) {
    let res = { code: 0, msg: '' };
    let { uid } = this.getClientInfo();
    // 业务逻辑开始-----------------------------------------------------------
    let { todayStart, todayEnd, yesterdayStart, yesterdayEnd } = vk.pubfn.getCommonTime();

    let batchRunRes = await vk.pubfn.batchRun({
      main: [
        // 0 - 获取房间列表（含进行中记录映射）
        async () => {
          return await vk.baseDao.selects({
            dbName: dbName.room,
            getMain: true,
            sortArr: [{ name: 'name', type: 'asc' }],
            foreignDB: [
              {
                dbName: dbName.record,
                localKey: '_id',
                foreignKey: 'room_id',
                as: 'activeRecord',
                limit: 1,
                // whereJson: { status: _.lt(2) },
                fieldJson: { _id: true, staff_name: true, end_time: true, status: true },
                sortArr: [{ name: '_add_time', type: 'desc' }],
              },
            ],
            addFields: {
              technician: '$activeRecord.staff_name',
              end_time: '$activeRecord.end_time',
              record_id: '$activeRecord._id',
              record_status: '$activeRecord.status',
            },
            fieldJson: {
              activeRecord: false,
            },
          });
        },
        // 1 - 获取技师列表
        async () => {
          return await vk.baseDao.select({
            dbName: dbName.user,
            getMain: true,
            whereJson: {
              role: 'staff',
            },
            sortArr: [{ name: 'nickname', type: 'asc' }],
          });
        },
        // 2 - 今日记录统计（营收、订单、客流）
        async () => {
          return await vk.baseDao.selects({
            dbName: dbName.record,
            getMain: true,
            getOne: true,
            whereJson: _.and([
              {
                _add_time: _.gte(yesterdayStart).lte(todayEnd),
              },
              {
                status: _.gte(0),
              },
            ]),
            groupJson: {
              _id: null,
              orderCount: $.sum(
                $.cond({
                  if: $.and([$.gte(['$_add_time', todayStart]), $.lt(['$_add_time', todayEnd])]),
                  then: 1,
                  else: 0,
                })
              ),
              todayPrice: $.sum(
                $.cond({
                  if: $.and([$.gte(['$_add_time', todayStart]), $.lt(['$_add_time', todayEnd])]),
                  then: '$price',
                  else: 0,
                })
              ),
              yesterdayPrice: $.sum(
                $.cond({
                  if: $.and([$.gte(['$_add_time', yesterdayStart]), $.lt(['$_add_time', yesterdayEnd])]),
                  then: '$price',
                  else: 0,
                })
              ),
            },
          });
        },
        // 3 - 今日新增会员
        async () => {
          return await vk.baseDao.count({
            dbName: dbName.user,
            whereJson: {
              register_date: _.gte(todayStart).lt(todayEnd),
            },
          });
        },
      ],
      concurrency: 4,
    });

    // console.log('batchRunRes', batchRunRes.stack[2]);
    res.roomList = batchRunRes.stack[0];
    res.staffList = batchRunRes.stack[1];

    const { todayPrice = 0, yesterdayPrice = 0, orderCount = 0 } = batchRunRes.stack[2] || {};

    const change = yesterdayPrice > 0 ? (((todayPrice - yesterdayPrice) / yesterdayPrice) * 100).toFixed(2) : 0;

    res.revenue = {
      today: todayPrice,
      yesterday: yesterdayPrice,
      change,
      orders: orderCount,
      visitors: 0,
      newMembers: batchRunRes.stack[3],
    };

    // 业务逻辑结束-----------------------------------------------------------
    return res;
  },
};

module.exports = cloudObject;
