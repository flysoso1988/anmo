<template>
  <view class="container">
    <wd-toast />

    <!-- 选择技师 -->
    <wd-cell-group title="选择技师">
      <view class="staff-list">
        <view
          v-for="item in staffList"
          :key="item._id"
          class="staff-item"
          :class="{ active: form.staff_id === item._id }"
          @click="selectStaff(item)"
        >
          <view class="staff-avatar">{{ item.name[0] }}</view>
          <view class="staff-name">{{ item.name }}</view>
        </view>
        <view v-if="staffList.length === 0" class="empty-tip">暂无空闲技师</view>
      </view>
    </wd-cell-group>

    <!-- 选择房间 -->
    <wd-cell-group title="选择房间">
      <view class="room-list" v-if="!fixedRoomId">
        <view
          v-for="item in roomList"
          :key="item._id"
          class="room-item"
          :class="{ active: form.room_id === item._id }"
          @click="selectRoom(item)"
        >
          <view class="room-name">{{ item.name }}</view>
          <wd-tag :type="item.type === 1 ? 'danger' : 'primary'" size="small">
            {{ item.type === 1 ? 'VIP' : '普通' }}
          </wd-tag>
        </view>
        <view v-if="roomList.length === 0" class="empty-tip">暂无空闲房间</view>
      </view>
      <view v-else class="fixed-room">
        <wd-tag type="primary" round>{{ form.room_name }}</wd-tag>
      </view>
    </wd-cell-group>

    <!-- 选择服务项目 -->
    <wd-cell-group title="选择服务项目">
      <wd-cell
        v-for="item in serviceList"
        :key="item._id"
        :title="item.name"
        :label="item.duration + '分钟'"
        :value="'¥' + item.price"
        :class="{ 'service-active': form.service_id === item._id }"
        clickable
        @click="selectService(item)"
      />
      <view v-if="serviceList.length === 0" class="empty-tip">暂无可用服务</view>
    </wd-cell-group>

    <!-- 顾客信息（选填） -->
    <wd-cell-group title="顾客信息（选填）">
      <wd-input label="姓名" v-model="form.customer_name" placeholder="请输入顾客姓名" />
      <wd-input label="手机" v-model="form.customer_phone" placeholder="请输入顾客手机号" type="number" :maxlength="11" />
      <wd-input label="备注" v-model="form.remark" placeholder="请输入备注" />
    </wd-cell-group>

    <!-- 底部按钮 -->
    <view class="footer">
      <wd-button block :disabled="!canSubmit" :loading="submitting" @click="submit">确认</wd-button>
    </view>
  </view>
</template>

<script>
import { useToast } from '@/uni_modules/wot-design-uni';

let vk = uni.vk;
export default {
  data() {
    return {
      staffList: [],
      roomList: [],
      serviceList: [],
      fixedRoomId: '',
      form: {
        staff_id: '',
        staff_name: '',
        room_id: '',
        room_name: '',
        service_id: '',
        service_name: '',
        customer_name: '',
        customer_phone: '',
        remark: '',
      },
      submitting: false,
    };
  },
  computed: {
    canSubmit() {
      return this.form.staff_id && this.form.room_id && this.form.service_id && !this.submitting;
    },
  },
  onLoad(options) {
    vk = uni.vk;
    this.toast = useToast();
    // 如果传入了room_id，则固定房间选择
    if (options.room_id) {
      this.fixedRoomId = options.room_id;
      this.form.room_id = options.room_id;
      this.form.room_name = decodeURIComponent(options.room_name || '');
    }
    this.loadData();
  },
  methods: {
    // 加载数据
    async loadData() {
      uni.showLoading({ title: '加载中' });
      try {
        let tasks = [this.loadStaffList(), this.loadServiceList()];
        // 如果没有固定房间，则加载房间列表
        if (!this.fixedRoomId) {
          tasks.push(this.loadRoomList());
        }
        await Promise.all(tasks);
      } catch (e) {
        console.error(e);
      } finally {
        uni.hideLoading();
      }
    },
    // 获取技师列表
    async loadStaffList() {
      let res = await vk.callFunction({ url: 'client/select.getStaffList' });
      if (res.code === 0) {
        this.staffList = res.list;
      }
    },
    // 获取房间列表
    async loadRoomList() {
      let res = await vk.callFunction({ url: 'client/select.getRoomList' });
      if (res.code === 0) {
        this.roomList = res.list;
      }
    },
    // 获取服务项目列表
    async loadServiceList() {
      let res = await vk.callFunction({ url: 'client/select.getServiceList' });
      if (res.code === 0) {
        this.serviceList = res.list;
      }
    },
    // 选择技师
    selectStaff(item) {
      this.form.staff_id = item._id;
      this.form.staff_name = item.name;
    },
    // 选择房间
    selectRoom(item) {
      this.form.room_id = item._id;
      this.form.room_name = item.name;
    },
    // 选择服务项目
    selectService(item) {
      this.form.service_id = item._id;
      this.form.service_name = item.name;
    },
    // 提交上钟
    async submit() {
      if (!this.canSubmit) return;
      if (!this.form.staff_id) {
        this.toast.show('请选择技师');
        return;
      }
      if (!this.form.room_id) {
        this.toast.show('请选择房间');
        return;
      }
      if (!this.form.service_id) {
        this.toast.show('请选择服务项目');
        return;
      }

      this.submitting = true;
      uni.showLoading({ title: '提交中' });
      try {
        let res = await vk.callFunction({
          url: 'client/record.add',
          data: {
            staff_id: this.form.staff_id,
            room_id: this.form.room_id,
            service_id: this.form.service_id,
            customer_name: this.form.customer_name,
            customer_phone: this.form.customer_phone,
            remark: this.form.remark,
          },
        });
        if (res.code === 0) {
          this.toast.success('上钟成功');
          setTimeout(() => {
            uni.navigateBack();
          }, 1500);
        } else {
          this.toast.show(res.msg);
        }
      } catch (e) {
        this.toast.show('提交失败');
        console.error(e);
      } finally {
        this.submitting = false;
        uni.hideLoading();
      }
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

.staff-list {
  display: flex;
  flex-wrap: wrap;
  padding: 20rpx 30rpx;
  gap: 20rpx;
}

.staff-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
  padding: 16rpx 24rpx;
  border: 2rpx solid #e5e5e5;
  border-radius: 12rpx;
  transition: all 0.2s;

  &.active {
    border-color: #ff6b6b;
    background-color: #fff5f5;
  }
}

.staff-avatar {
  width: 60rpx;
  height: 60rpx;
  border-radius: 50%;
  background-color: #ff6b6b;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
}

.staff-name {
  font-size: 24rpx;
  color: #333;
}

.room-list {
  display: flex;
  flex-wrap: wrap;
  padding: 20rpx 30rpx;
  gap: 20rpx;
}

.room-item {
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding: 16rpx 24rpx;
  border: 2rpx solid #e5e5e5;
  border-radius: 12rpx;
  transition: all 0.2s;

  &.active {
    border-color: #ff6b6b;
    background-color: #fff5f5;
  }
}

.room-name {
  font-size: 28rpx;
  color: #333;
}

.fixed-room {
  padding: 20rpx 30rpx;
}

.empty-tip {
  width: 100%;
  text-align: center;
  padding: 40rpx 0;
  font-size: 28rpx;
  color: #999;
}

:deep(.service-active) {
  background-color: #fff5f5;
}

:deep(.service-active .wd-cell__value) {
  color: #ff6b6b;
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
