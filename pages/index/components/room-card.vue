<template>
  <view class="room-card" :class="'status-' + room.status" @click="$emit('click', room)">
    <text class="room-name">{{ room.name }}</text>
    <view v-if="room.status === 1">
      <template v-if="room.record_status === 0">
        <text class="room-tech">{{ room.technician || '技师' }}</text>
        <wd-count-down v-if="room.end_time" :key="room._id" :time="countDownTime" format="HH:mm:ss" :auto-start="true" @finish="onCountDownFinish">
          <template #default="{ current }">
            <text class="room-endtime">{{ current.hours * 60 + current.minutes }}分钟</text>
          </template>
        </wd-count-down>
      </template>
      <template v-else>使用中</template>
    </view>
    <!-- <view v-else-if="room.status === 2">清洁中</view> -->
    <view v-else> 空闲中 </view>
  </view>
</template>

<script>
  var vk = uni.vk;

  export default {
    name: 'room-card',
    props: {
      room: { type: Object, required: true },
    },
    emits: ['click'],
    computed: {
      countDownTime() {
        if (!this.room.end_time) return 0;
        return Math.max(0, this.room.end_time - Date.now());
      },
    },
    methods: {
      onCountDownFinish() {
        if (!this.room.record_id) return;
      },
    },
  };
</script>

<style lang="scss" scoped>
  .room-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4rpx;
    border-radius: 16rpx;
    padding: 24rpx 8rpx;
    border: 2rpx solid;
    transition: all 0.2s;
    width: 200rpx;
    height: 200rpx;
    justify-self: center;
    box-sizing: border-box;

    &.status-0 {
      background-color: #f0faf0;
      border-color: #b7eb8f;
    }

    &.status-1 {
      background-color: #fff2f0;
      border-color: #ffa39e;
    }

    &.status-2 {
      background-color: #fafafa;
      border-color: #d9d9d9;
    }
  }

  .room-name {
    font-size: 30rpx;
    font-weight: 700;
    color: #333;
  }

  .room-tech {
    font-size: 22rpx;
    color: #666;
  }

  .room-endtime {
    font-size: 20rpx;
    color: #999;
  }
</style>
