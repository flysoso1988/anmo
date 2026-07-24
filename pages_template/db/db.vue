<template>
  <view class="page">
    <view class="header">
      <text class="title">相关文档</text>
    </view>

    <view class="card-list">
      <view class="card" @click="openWeb('https://vkdoc.fsq.pub/client/uniCloud/db/api.html')">
        <view class="card-title">数据库基本 API</view>
        <view class="card-desc">小白也能轻松上手的数据库API文档</view>
        <view class="card-url">https://vkdoc.fsq.pub/client/uniCloud/db/api.html</view>
        <view class="card-link">查看文档 →</view>
      </view>

      <view class="card" @click="openWeb('https://vkdoc.fsq.pub/client/uniCloud/db/selects.html')">
        <view class="card-title">万能连表 API</view>
        <view class="card-desc">强大的多表关联查询解决方案</view>
        <view class="card-url">https://vkdoc.fsq.pub/client/uniCloud/db/selects.html</view>
        <view class="card-link">查看文档 →</view>
      </view>
    </view>
  </view>
</template>

<script>
  let vk = uni.vk;
  export default {
    data() {
      return {};
    },
    onLoad(options) {
      vk = uni.vk;
      this.init(options);
    },
    methods: {
      // 页面数据初始化函数
      init(options) {},
      openWeb(url) {
        // #ifdef WEB
        window.open(url);
        // #endif
        // #ifndef WEB
        vk.pubfn.setClipboardData({
          data: url,
          success: () => {
            vk.toast('地址复制成功');
          },
        });
        // #endif
      },
    },
  };
</script>

<style scoped>
  page {
    background: #f8f8f8;
  }

  .page {
    padding: 20px;
  }

  .header {
    text-align: center;
    margin-bottom: 30px;
  }

  .title {
    font-size: 24px;
    font-weight: 600;
    color: #333333;
    letter-spacing: 1px;
  }

  .card-list {
    display: flex;
    flex-direction: column;
    gap: 15px;
  }

  .card {
    background: #ffffff;
    border-radius: 10px;
    padding: 20px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
    transition: all 0.3s ease;
  }

  .card:active {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.16);
  }

  .card-title {
    font-size: 18px;
    font-weight: 600;
    color: #333333;
    margin-bottom: 8px;
  }

  .card-desc {
    font-size: 14px;
    color: #666666;
    line-height: 1.6;
    margin-bottom: 12px;
  }

  .card-link {
    font-size: 14px;
    color: #667eea;
    font-weight: 500;
  }

  .card-url {
    font-size: 12px;
    color: #999999;
    margin-bottom: 10px;
    word-break: break-all;
  }
</style>
