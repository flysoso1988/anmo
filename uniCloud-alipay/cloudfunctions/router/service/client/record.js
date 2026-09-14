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
   * 提交上钟
   * @url client/record.add
   */
  add: async function (data) {
    let res = { code: 0, msg: '' };
    let { uid } = this.getClientInfo();
    let { staff_id, room_id, service_id, customer_name, customer_phone, remark } = data;
    // 业务逻辑开始-----------------------------------------------------------
    // 参数校验
    if (!staff_id) {
      return { code: -1, msg: '请选择技师' };
    }
    if (!room_id) {
      return { code: -1, msg: '请选择房间' };
    }
    if (!service_id) {
      return { code: -1, msg: '请选择服务项目' };
    }

    // 查询技师信息
    let staff = await vk.baseDao.findById({
      dbName: dbName.staff,
      id: staff_id,
    });
    if (!staff || staff.status !== 0) {
      return { code: -1, msg: '该技师不可用' };
    }

    // 查询房间信息
    let room = await vk.baseDao.findById({
      dbName: dbName.room,
      id: room_id,
    });
    if (!room || room.status !== 0) {
      return { code: -1, msg: '该房间不可用' };
    }

    // 查询服务项目信息
    let service = await vk.baseDao.findById({
      dbName: dbName.service,
      id: service_id,
    });
    if (!service || service.status !== true) {
      return { code: -1, msg: '该服务项目不可用' };
    }

    // 计算时间（时间戳，毫秒）
    let startTime = Date.now();
    let endTime = startTime + service.duration * 60 * 1000;

    // 创建上钟记录
    let recordData = {
      staff_id: staff._id,
      staff_name: staff.name,
      room_id: room._id,
      room_name: room.name,
      service_id: service._id,
      service_name: service.name,
      price: service.price,
      duration: service.duration,
      start_time: startTime,
      end_time: endTime,
      status: 0,
      operator_id: uid,
    };

    // 可选字段
    if (customer_name) recordData.customer_name = customer_name;
    if (customer_phone) recordData.customer_phone = customer_phone;
    if (remark) recordData.remark = remark;

    // 插入记录
    let addRes = await vk.baseDao.add({
      dbName: dbName.record,
      dataJson: recordData,
    });
    res.record_id = addRes.id;

    // 更新技师状态为上钟
    await vk.baseDao.update({
      dbName: dbName.staff,
      whereJson: { _id: staff_id },
      dataJson: { status: 1 },
    });

    // 更新房间状态为使用中
    await vk.baseDao.update({
      dbName: dbName.room,
      whereJson: { _id: room_id },
      dataJson: { status: 1 },
    });

    res.msg = '上钟成功';
    // 业务逻辑结束-----------------------------------------------------------
    return res;
  },

  /**
   * 获取上钟记录列表
   * @url client/record.getList
   */
  getList: async function (data) {
    let res = { code: 0, msg: '' };
    let { uid } = this.getClientInfo();
    let { status, page = 1, pageSize = 20 } = data;
    // 业务逻辑开始-----------------------------------------------------------
    let whereJson = {};
    if (status !== undefined) {
      whereJson.status = status;
    }

    let result = await vk.baseDao.select({
      dbName: dbName.record,
      whereJson,
      pageIndex: page,
      pageSize: pageSize,
      sortArr: [{ name: '_add_time', type: 'desc' }],
    });

    res.list = result.rows;
    // 业务逻辑结束-----------------------------------------------------------
    return res;
  },

  /**
   * 根据房间ID获取进行中的记录
   * @url client/record.getActiveByRoom
   */
  getActiveByRoom: async function (data) {
    let res = { code: 0, msg: '' };
    let { uid } = this.getClientInfo();
    let { room_id } = data;
    // 业务逻辑开始-----------------------------------------------------------
    if (!room_id) {
      return { code: -1, msg: '房间ID不能为空' };
    }

    let record = await vk.baseDao.select({
      dbName: dbName.record,
      whereJson: { room_id, status: 0 },
      pageIndex: 1,
      pageSize: 1,
    });

    if (!record.rows || record.rows.length === 0) {
      return { code: -1, msg: '该房间没有进行中的记录' };
    }

    res.data = record.rows[0];
    // 业务逻辑结束-----------------------------------------------------------
    return res;
  },

  /**
   * 获取记录详情
   * @url client/record.getDetail
   */
  getDetail: async function (data) {
    let res = { code: 0, msg: '' };
    let { uid } = this.getClientInfo();
    let { id } = data;
    // 业务逻辑开始-----------------------------------------------------------
    if (!id) {
      return { code: -1, msg: '记录ID不能为空' };
    }

    let detail = await vk.baseDao.findById({
      dbName: dbName.record,
      id: id,
    });

    if (!detail) {
      return { code: -1, msg: '记录不存在' };
    }

    res.data = detail;
    // 业务逻辑结束-----------------------------------------------------------
    return res;
  },

  /**
   * 下钟（结束服务）
   * @url client/record.end
   */
  end: async function (data) {
    let res = { code: 0, msg: '' };
    let { uid } = this.getClientInfo();
    let { id } = data;
    // 业务逻辑开始-----------------------------------------------------------
    if (!id) {
      return { code: -1, msg: '记录ID不能为空' };
    }

    // 查询记录
    let record = await vk.baseDao.findById({
      dbName: dbName.record,
      id: id,
    });

    if (!record || record.status !== 0) {
      return { code: -1, msg: '记录不存在或已结束' };
    }

    // 更新记录状态
    await vk.baseDao.update({
      dbName: dbName.record,
      whereJson: { _id: id },
      dataJson: {
        status: 1,
        actual_end_time: Date.now(),
      },
    });

    // 更新技师状态为空闲
    await vk.baseDao.update({
      dbName: dbName.staff,
      whereJson: { _id: record.staff_id },
      dataJson: { status: 0 },
    });

    // 更新房间状态为空闲
    // await vk.baseDao.update({
    //   dbName: dbName.room,
    //   whereJson: { _id: record.room_id },
    //   dataJson: { status: 0 },
    // });

    res.msg = '下钟成功';
    // 业务逻辑结束-----------------------------------------------------------
    return res;
  },

  /**
   * 支付（标记记录为已支付）
   * @url client/record.pay
   */
  pay: async function (data) {
    let res = { code: 0, msg: '' };
    let { uid } = this.getClientInfo();
    let { id } = data;
    // 业务逻辑开始-----------------------------------------------------------
    if (!id) {
      return { code: -1, msg: '记录ID不能为空' };
    }

    let record = await vk.baseDao.findById({
      dbName: dbName.record,
      id: id,
    });

    if (!record) {
      return { code: -1, msg: '记录不存在' };
    }
    if (record.status !== 1) {
      return { code: -1, msg: '仅已完成状态可支付' };
    }

    await vk.baseDao.update({
      dbName: dbName.record,
      whereJson: { _id: id },
      dataJson: { status: 2 },
    });

    await vk.baseDao.update({
      dbName: dbName.room,
      whereJson: { _id: record.room_id },
      dataJson: { status: 0 },
    });
    // 业务逻辑结束-----------------------------------------------------------
    return res;
  },
};

module.exports = cloudObject;
