const vk = uniCloud.vk;
const db = uniCloud.database();
const _ = db.command;
const dbName = require('../../../dao/config.js');

const path = require('path');
const moduleName = path.basename(__filename, path.extname(__filename));

module.exports = async function () {
  let res = { code: 0, msg: '' };
  // 业务逻辑开始-----------------------------------------------------------
  let now = new Date();

  let expiredRecords = await vk.baseDao.select({
    dbName: dbName.record,
    whereJson: {
      status: 0,
      end_time: _.lte(now),
    },
    pageSize: 500,
  });

  let records = expiredRecords.rows || [];
  if (records.length === 0) {
    console.log(`[${moduleName}]: 没有需要自动结束的记录`);
    res.msg = '没有需要自动结束的记录';
    return res;
  }

  let successCount = 0;
  let failCount = 0;

  for (let record of records) {
    try {
      await vk.baseDao.update({
        dbName: dbName.record,
        whereJson: { _id: record._id },
        dataJson: {
          status: 1,
          actual_end_time: Date.now(),
        },
      });

      if (record.staff_id) {
        await vk.baseDao.update({
          dbName: dbName.staff,
          whereJson: { _id: record.staff_id },
          dataJson: { status: 0 },
        });
      }

      if (record.room_id) {
        await vk.baseDao.update({
          dbName: dbName.room,
          whereJson: { _id: record.room_id },
          dataJson: { status: 0 },
        });
      }

      successCount++;
    } catch (err) {
      console.error(`[${moduleName}]: 自动结束记录失败`, record._id, err);
      failCount++;
    }
  }

  console.log(`[${moduleName}]: 自动结束完成，成功 ${successCount} 条，失败 ${failCount} 条`);
  res.msg = `自动结束完成，成功 ${successCount} 条，失败 ${failCount} 条`;
  // 业务逻辑结束-----------------------------------------------------------
  return res;
};
