<template>
  <view class="container">
    <!-- 服务信息 -->
    <wd-cell-group border>
      <wd-cell title="服务项目" :value="detail.service_name" />
      <wd-cell title="项目金额">
        <text class="price">¥{{ detail.price }}</text>
      </wd-cell>
      <wd-cell title="服务时长" :value="detail.duration + '分钟'" />
    </wd-cell-group>

    <!-- 技师房间 -->
    <wd-cell-group border>
      <wd-cell title="技师" :value="detail.staff_name" />
      <wd-cell title="房间" :value="detail.room_name" />
    </wd-cell-group>

    <!-- 时间信息 -->
    <wd-cell-group border>
      <wd-cell title="上钟时间" :value="formatTime(detail.start_time)" />
      <wd-cell title="预计下钟" :value="formatTime(detail.end_time)" />
      <wd-cell title="实际下钟" :value="formatTime(detail.actual_end_time)" />
      <wd-cell title="状态">
        <wd-tag :type="statusType[detail.status]" round>
          {{ statusText[detail.status] }}
        </wd-tag>
      </wd-cell>
    </wd-cell-group>

    <!-- 顾客信息 -->
    <wd-cell-group v-if="detail.customer_name || detail.customer_phone || detail.remark" border>
      <wd-cell v-if="detail.customer_name" title="姓名" :value="detail.customer_name" />
      <wd-cell v-if="detail.customer_phone" title="手机号" :value="detail.customer_phone" />
      <wd-cell v-if="detail.remark" title="备注" :value="detail.remark" />
    </wd-cell-group>
    <!-- 底部按钮 -->
    <view class="footer" v-if="detail.status === 0">
      <wd-button block type="error" @click="endRecord">下钟</wd-button>
    </view>
  </view>
</template>

<script>
  import { useToast } from '@/uni_modules/wot-design-uni';

  let vk = uni.vk;
  export default {
    data() {
      return {
        detail: {},
        statusText: {
          0: '进行中',
          1: '已完成',
          2: '已取消',
        },
        statusType: {
          0: 'warning',
          1: 'success',
          2: 'info',
        },
      };
    },
    onLoad(options) {
      vk = uni.vk;
      this.toast = useToast();
      if (options.id) {
        this.loadDetail(options.id);
      }
    },
    methods: {
      async loadDetail(id) {
        uni.showLoading({ title: '加载中' });
        let res = await vk.callFunction({
          url: 'client/record.getDetail',
          data: { id },
        });
        uni.hideLoading();
        if (res.code === 0) {
          this.detail = res.data;
        } else {
          this.toast.show(res.msg);
        }
      },
      formatTime(timestamp) {
        if (!timestamp) return '';
        let date = new Date(timestamp);
        let year = date.getFullYear();
        let month = (date.getMonth() + 1).toString().padStart(2, '0');
        let day = date.getDate().toString().padStart(2, '0');
        let hour = date.getHours().toString().padStart(2, '0');
        let minute = date.getMinutes().toString().padStart(2, '0');
        return `${year}-${month}-${day} ${hour}:${minute}`;
      },
      endRecord() {
        uni.showModal({
          title: '确认下钟',
          content: '确定要结束本次服务吗？',
          success: async (res) => {
            if (res.confirm) {
              uni.showLoading({ title: '处理中' });
              let result = await vk.callFunction({
                url: 'client/record.end',
                data: { id: this.detail._id },
              });
              uni.hideLoading();
              if (result.code === 0) {
                this.toast.success('下钟成功');
                this.detail.status = 1;
                this.detail.actual_end_time = new Date();
              } else {
                this.toast.show(result.msg);
              }
            }
          },
        });
      },
    },
  };
</script>

<style lang="scss" scoped>
  .container {
    min-height: 100vh;
    background-color: #f5f5f5;
    padding-bottom: 120rpx;
  }

  .status-bar {
    padding: 8rpx 0;
  }

  .price {
    font-size: 36rpx;
    font-weight: bold;
    color: #ff6b6b;
  }

  :deep(.wd-cell-group) {
    margin-top: 20rpx;
  }

  .footer {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #fff;
    padding: 20rpx 30rpx;
    padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
    box-shadow: 0 -2rpx 10rpx rgba(0, 0, 0, 0.05);
  }
</style>