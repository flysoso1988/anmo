<template>
  <view class="app">
    <!-- 导航栏 start -->
    <wd-navbar title="房间详情" left-arrow fixed placeholder safe-area-inset-top custom-class="room-detail-navbar" @click-left="handleBack"></wd-navbar>
    <!-- 导航栏 end -->
    <view class="nav-split"></view>

    <!-- 页面内容 start -->
    <view class="detail">
      <!-- 房间信息卡 start -->
      <wd-card custom-class="room-detail-card">
        <view class="room">
          <view class="room__head">
            <text class="room__name">{{ room.name }}</text>
            <wd-tag variant="light" :color="stateTag.color" :bg-color="stateTag.bg" :custom-style="stateTagStyle">
              <view class="state-tag">
                <view class="state-tag__dot" :style="{ background: stateTag.color }"></view>
                <text>{{ stateTag.text }}</text>
              </view>
            </wd-tag>
          </view>
          <view class="room__split"></view>
          <view class="room__row" v-for="row in roomRows" :key="row.label">
            <text class="room__label">{{ row.label }}</text>
            <text class="room__value">{{ row.value }}</text>
          </view>
        </view>
      </wd-card>
      <!-- 房间信息卡 end -->

      <!-- 未使用 / 使用中-无记录 start -->
      <template v-if="status === 'idle' || status === 'occupied'">
        <wd-card custom-class="room-detail-card room-detail-card--empty">
          <view class="empty">
            <view class="empty__icon" :style="{ background: emptyState.bg }">
              <wd-icon :name="emptyState.icon" :color="emptyState.color" size="24px"></wd-icon>
            </view>
            <text class="empty__title">{{ emptyState.title }}</text>
            <text class="empty__desc">{{ emptyState.desc }}</text>
          </view>
        </wd-card>
        <view class="tip" :style="{ background: emptyState.tipBg }">
          <wd-icon :name="emptyState.tipIcon" :color="emptyState.tipColor" size="16px"></wd-icon>
          <text class="tip__text" :style="{ color: emptyState.tipColor }">{{ emptyState.tipText }}</text>
        </view>
      </template>
      <!-- 未使用 / 使用中-无记录 end -->

      <!-- 使用中-有记录 start -->
      <template v-if="status === 'serving'">
        <view class="total">
          <view class="total__left">
            <text class="total__label">订单合计</text>
            <text class="total__amount">¥ {{ orderTotal }}</text>
          </view>
          <view class="countdown countdown--large">
            <wd-icon name="clock-circle" color="#2979ff" size="16px"></wd-icon>
            <text class="countdown__text countdown__text--large">{{ maxRemainText }}</text>
          </view>
        </view>
        <text class="section-title">服务记录（{{ recordList.length }}）</text>
      </template>
      <!-- 使用中-有记录 end -->

      <!-- 清理中 start -->
      <text class="section-title" v-if="status === 'cleaning'">服务记录（{{ recordList.length }}）</text>
      <!-- 清理中 end -->

      <!-- 服务记录列表 start -->
      <wd-card v-for="record in recordList" :key="record.id" custom-class="room-detail-card room-detail-card--record">
        <view class="record">
          <view class="record__head">
            <text class="record__name">{{ record.name }}</text>
            <!-- 服务中：倒计时 -->
            <view class="countdown" v-if="record.state === 'serving'">
              <wd-icon name="clock-circle" color="#2979ff" size="12px"></wd-icon>
              <text class="countdown__text">{{ record.remainText }}</text>
            </view>
            <!-- 已下钟 -->
            <wd-tag v-else variant="light" color="#00b42a" bg-color="#e8ffea" :custom-style="stateTagStyle">
              <view class="state-tag">
                <view class="state-tag__dot" style="background: #00b42a"></view>
                <text>已下钟</text>
              </view>
            </wd-tag>
          </view>
          <view class="record__tech">
            <wd-icon name="user" color="#86909c" size="14px"></wd-icon>
            <text class="record__tech-name">{{ record.tech }}</text>
            <text class="record__spec">{{ record.spec }}</text>
          </view>
          <view class="record__foot" v-if="record.state === 'serving'">
            <wd-button type="info" custom-class="room-detail-btn-change" :custom-style="changeBtnStyle" @click="onChangeService(record)">更换项目</wd-button>
            <text class="record__price">¥{{ record.price }}</text>
          </view>
        </view>
      </wd-card>
      <!-- 服务记录列表 end -->

      <!-- 清理提示 start -->
      <view class="tip tip--wide" v-if="status === 'cleaning'">
        <wd-icon name="brush" color="#ff7d00" size="18px"></wd-icon>
        <text class="tip__text" style="color: #ff7d00">保洁进行中，完成后点击下方按钮恢复空闲</text>
      </view>
      <!-- 清理提示 end -->
    </view>
    <!-- 页面内容 end -->

    <!-- 操作栏 start -->
    <view class="action-bar">
      <view class="action-bar__split"></view>
      <view class="action-bar__body">
        <!-- 未使用 -->
        <template v-if="status === 'idle'">
          <wd-button type="info" custom-class="room-detail-btn" :custom-style="secondBtnStyle" @click="onEditRoom">编辑房间</wd-button>
          <wd-button type="primary" custom-class="room-detail-btn" :custom-style="primaryBtnStyle" @click="onOccupyRoom">开单占房</wd-button>
        </template>
        <!-- 使用中-无记录 -->
        <template v-else-if="status === 'occupied'">
          <wd-button type="info" custom-class="room-detail-btn" :custom-style="secondBtnStyle" @click="onCancelOccupy">取消占房</wd-button>
          <wd-button type="primary" custom-class="room-detail-btn" :custom-style="primaryBtnStyle" @click="openAddService">添加服务</wd-button>
        </template>
        <!-- 使用中-有记录 -->
        <template v-else-if="status === 'serving'">
          <wd-button type="primary" custom-class="room-detail-btn" :custom-style="primaryBtnStyle" @click="openAddService">添加服务</wd-button>
          <wd-button type="danger" custom-class="room-detail-btn" :custom-style="dangerBtnStyle" @click="onForceFinish">强制下钟</wd-button>
        </template>
        <!-- 清理中 -->
        <template v-else>
          <wd-button type="primary" custom-class="room-detail-btn" :custom-style="primaryBtnStyle" @click="onFinishCleaning">保洁完成，恢复空闲</wd-button>
        </template>
      </view>
    </view>
    <!-- 操作栏 end -->

    <!-- 添加服务弹窗 start -->
    <wd-popup v-model="showAddService" position="bottom" round safe-area-inset-bottom custom-class="room-detail-popup" @close="onAddServiceClose">
      <view class="popup">
        <!-- 弹窗头 start -->
        <view class="popup__head">
          <view class="popup__handle"></view>
          <text class="popup__title">添加服务项目</text>
          <wd-steps :active="serviceStep" custom-class="room-detail-steps">
            <wd-step title="选择项目" custom-class="room-detail-steps__item">
              <template #icon>
                <text class="room-detail-steps__num">1</text>
              </template>
            </wd-step>
            <wd-step title="选择技师" custom-class="room-detail-steps__item">
              <template #icon>
                <text class="room-detail-steps__num">2</text>
              </template>
            </wd-step>
            <view class="room-detail-steps__link">
              <view class="room-detail-steps__line"></view>
              <wd-icon name="arrow-right" color="#c9cdd4" size="16px"></wd-icon>
            </view>
          </wd-steps>
        </view>
        <!-- 弹窗头 end -->

        <!-- 弹窗内容 start -->
        <scroll-view class="popup__body" scroll-y>
          <!-- 步骤一：选择项目 -->
          <view class="popup__section" v-if="serviceStep === 0">
            <view class="popup__section-head">
              <text class="popup__section-title">选择服务项目</text>
              <text class="popup__section-count">{{ services.length }} 个可选</text>
            </view>
            <view
              class="service-item"
              :class="{ 'service-item--active': index === selectedServiceIndex }"
              v-for="(item, index) in services"
              :key="item.name"
              @click="onSelectService(index)"
            >
              <wd-icon :name="index === selectedServiceIndex ? 'check-circle' : 'circular'" :color="index === selectedServiceIndex ? '#2979ff' : '#c9cdd4'" size="20px"></wd-icon>
              <view class="service-item__info">
                <text class="service-item__name">{{ item.name }}</text>
                <text class="service-item__spec">{{ serviceSpec(item) }}</text>
              </view>
              <wd-tag variant="light" color="#2979ff" :bg-color="index === selectedServiceIndex ? '#ffffff' : '#e8f3ff'" :custom-style="categoryTagStyle">{{
                item.category
              }}</wd-tag>
            </view>
          </view>

          <!-- 步骤二：选择技师 -->
          <view class="popup__section" v-else>
            <view class="selected-summary">
              <text class="selected-summary__label">已选项目</text>
              <view class="selected-summary__row">
                <text class="selected-summary__name">{{ selectedService.name }}</text>
                <text class="selected-summary__spec">{{ serviceSpec(selectedService) }}</text>
              </view>
            </view>
            <view class="popup__section-head">
              <text class="popup__section-title">选择技师</text>
              <text class="popup__section-count">默认选中第 1 位</text>
            </view>
            <view
              class="tech-item"
              :class="{ 'tech-item--active': index === selectedTechIndex }"
              v-for="(tech, index) in technicians"
              :key="tech.name"
              @click="onSelectTech(index)"
            >
              <view class="tech-item__avatar" :style="{ background: tech.bg }">
                <text class="tech-item__avatar-text" :style="{ color: tech.color }">{{ tech.short }}</text>
              </view>
              <view class="tech-item__info">
                <text class="tech-item__name">{{ tech.name }}</text>
                <text class="tech-item__desc">{{ tech.title }} · {{ tech.state }}</text>
              </view>
              <wd-icon v-if="index === selectedTechIndex" name="check-circle" color="#2979ff" size="20px"></wd-icon>
            </view>
          </view>
        </scroll-view>
        <!-- 弹窗内容 end -->

        <!-- 弹窗底部 start -->
        <view class="popup__foot">
          <view class="popup__split"></view>
          <view class="popup__buttons">
            <wd-button type="info" custom-class="room-detail-btn" :custom-style="secondBtnStyle" @click="onPrevStep">{{ serviceStep === 0 ? '取消' : '上一步' }}</wd-button>
            <wd-button type="primary" custom-class="room-detail-btn" :custom-style="primaryBtnStyle" @click="onNextStep">{{
              serviceStep === 0 ? '下一步：选择技师' : '确认添加'
            }}</wd-button>
          </view>
        </view>
        <!-- 弹窗底部 end -->
      </view>
    </wd-popup>
    <!-- 添加服务弹窗 end -->
  </view>
</template>

<script>
  let vk = uni.vk;
  export default {
    data() {
      // 页面数据变量
      return {
        // init请求返回的数据
        data: {},
        // 表单请求数据
        form1: {},
        // 房态：idle 未使用 | occupied 使用中-无记录 | serving 使用中-有记录 | cleaning 清理中
        status: 'idle',
        // 房间信息（设计稿静态数据，后续接接口后替换）
        room: {
          id: '',
          name: '205 足疗房',
          type: '足疗 · 单人间',
          area: '二层 · A 区',
          facilities: '足浴盆 · 空调 · 电视',
        },
        // 服务记录
        records: [],
        countdownTimer: null,
        // 添加服务弹窗
        showAddService: false,
        serviceStep: 0,
        selectedServiceIndex: 0,
        selectedTechIndex: 0,
        // 服务项目（设计稿 03f 添加服务 / 底部弹窗）
        services: [
          { name: '中式足疗套餐', duration: 60, price: 198, category: '足疗' },
          { name: '头部按摩', duration: 15, price: 70, category: '按摩' },
          { name: '肩颈按摩', duration: 30, price: 128, category: '按摩' },
          { name: '中药泡脚', duration: 20, price: 58, category: '足浴' },
          { name: '全身精油推拿', duration: 90, price: 368, category: '推拿' },
          { name: '拔罐理疗', duration: 30, price: 118, category: '理疗' },
        ],
        // 技师（设计稿 03e 添加服务 / 选择技师）
        technicians: [
          { name: '李晓彤', short: '李', title: '高级足疗师', state: '在岗', color: '#2979ff', bg: '#e8f3ff' },
          { name: '王慧敏', short: '王', title: '足疗师', state: '在岗', color: '#00b42a', bg: '#e8ffea' },
          { name: '张思远', short: '张', title: '理疗师', state: '在岗', color: '#ff7d00', bg: '#fff7e8' },
          { name: '陈佳怡', short: '陈', title: '按摩师', state: '请假', color: '#f53f3f', bg: '#ffece8' },
          { name: '刘明轩', short: '刘', title: '助理技师', state: '休息', color: '#86909c', bg: '#f2f3f5' },
        ],
        // 组件样式（尺寸对齐设计稿）
        stateTagStyle: 'padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: 500; line-height: 1.55; border: none;',
        categoryTagStyle: 'padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: 400; line-height: 1.55; border: none;',
        primaryBtnStyle: 'height: 48px; min-height: 48px; padding: 0; border-radius: 10px; font-size: 16px; font-weight: 500; line-height: 1;',
        secondBtnStyle:
          'height: 44px; min-height: 44px; padding: 0; border-radius: 10px; font-size: 15px; font-weight: 500; line-height: 1; background: #f2f3f5; color: #1d2129; border: none;',
        dangerBtnStyle:
          'height: 48px; min-height: 48px; padding: 0; border-radius: 10px; font-size: 16px; font-weight: 500; line-height: 1; background: #ffece8; color: #f53f3f; border: none;',
        changeBtnStyle:
          'width: 100px; height: 32px; min-height: 32px; padding: 0; border-radius: 8px; font-size: 13px; font-weight: 500; line-height: 1; background: #f2f3f5; color: #1d2129; border: none;',
      };
    },
    // 监听 - 页面每次【加载时】执行(如：前进)
    onLoad(options = {}) {
      vk = uni.vk;
      this.options = options;
      this.init(options);
    },
    // 监听 - 页面【首次渲染完成时】执行。注意如果渲染速度快，会在页面进入动画完成前触发
    onReady() {},
    // 监听 - 页面每次【显示时】执行（如：前进和返回）（页面每次出现在屏幕上都触发，包括从下级页面点返回露出当前页面）
    onShow() {},
    // 监听 - 页面每次【隐藏时】执行（如：返回）
    onHide() {},
    // 监听 - 页面每次【卸载时】（一般用于取消页面上的监听器）
    onUnload() {
      this.stopCountdown();
    },
    // 监听 - 页面下拉刷新
    onPullDownRefresh() {
      setTimeout(() => {
        uni.stopPullDownRefresh();
      }, 1000);
    },
    /**
     * 监听 - 点击右上角转发时 文档 https://uniapp.dcloud.io/api/plugins/share?id=onshareappmessage
     * 如果删除onShareAppMessage函数，则微信小程序右上角转发按钮会自动变灰
     */
    onShareAppMessage(options) {},
    // 函数
    methods: {
      // 页面数据初始化函数
      init(options = {}) {
        console.log('init: ', options);
        // 从房间列表进入时带房间号
        this.room.id = options.id || '';
        this.room.name = `${options.id || '205'} 足疗房`;
      },
      // 返回上一页
      handleBack() {
        vk.navigateBack();
      },
      // 编辑房间
      onEditRoom() {
        vk.toast(`${this.room.name} · 编辑房间`);
      },
      // 开单占房：未使用 -> 使用中（无记录）
      onOccupyRoom() {
        this.status = 'occupied';
        vk.toast('已开单占房，请添加服务项目');
      },
      // 取消占房：使用中（无记录）-> 未使用
      onCancelOccupy() {
        this.status = 'idle';
        vk.toast('已取消占房');
      },
      // 打开添加服务弹窗
      openAddService() {
        this.serviceStep = 0;
        this.selectedServiceIndex = 0;
        this.selectedTechIndex = 0;
        this.showAddService = true;
      },
      // 关闭添加服务弹窗
      closeAddService() {
        this.showAddService = false;
      },
      onAddServiceClose() {
        this.serviceStep = 0;
      },
      // 弹窗底部左侧按钮：取消 / 上一步
      onPrevStep() {
        if (this.serviceStep === 0) {
          this.closeAddService();
        } else {
          this.serviceStep = 0;
        }
      },
      // 弹窗底部右侧按钮：下一步 / 确认添加
      onNextStep() {
        if (this.serviceStep === 0) {
          this.serviceStep = 1;
        } else {
          this.confirmAddService();
        }
      },
      // 选择服务项目
      onSelectService(index) {
        this.selectedServiceIndex = index;
      },
      // 选择技师（仅「在岗」技师可选）
      onSelectTech(index) {
        const tech = this.technicians[index];
        if (tech.state !== '在岗') {
          vk.toast(`${tech.name} 当前${tech.state}，暂不可选`);
          return;
        }
        this.selectedTechIndex = index;
      },
      // 确认添加：使用中（无记录）-> 使用中（有记录）
      confirmAddService() {
        const service = this.selectedService;
        const tech = this.technicians[this.selectedTechIndex];
        this.records = [
          // 本次添加的服务项目
          {
            id: `record-${Date.now()}`,
            name: service.name,
            tech: tech.name,
            spec: `${service.duration} 分钟 · ¥${service.price}`,
            price: service.price,
            remainSec: 38 * 60 + 12,
            state: 'serving',
          },
          // 设计稿演示数据：房间中已在进行的服务记录
          {
            id: `record-${Date.now() + 1}`,
            name: '头部按摩',
            tech: '王慧敏',
            spec: '15 分钟 · ¥70',
            price: 70,
            remainSec: 8 * 60 + 40,
            state: 'serving',
          },
        ];
        this.status = 'serving';
        this.showAddService = false;
        this.serviceStep = 0;
        this.startCountdown();
        vk.toast(`已添加 ${service.name} · ${tech.name}`);
      },
      // 更换项目
      onChangeService(record) {
        vk.toast(`${record.name} · 更换项目`);
      },
      // 强制下钟：使用中（有记录）-> 清理中
      onForceFinish() {
        this.stopCountdown();
        this.records.forEach((record) => {
          record.state = 'done';
        });
        this.status = 'cleaning';
        vk.toast('已强制下钟，房间转入清理中');
      },
      // 保洁完成：清理中 -> 未使用
      onFinishCleaning() {
        this.records = [];
        this.status = 'idle';
        vk.toast('保洁完成，房间已恢复空闲');
      },
      // 服务剩余时间倒计时
      startCountdown() {
        if (this.countdownTimer) return;
        this.countdownTimer = setInterval(() => {
          this.records.forEach((record) => {
            if (record.remainSec > 0) record.remainSec -= 1;
          });
        }, 1000);
      },
      stopCountdown() {
        if (this.countdownTimer) {
          clearInterval(this.countdownTimer);
          this.countdownTimer = null;
        }
      },
      // 服务项目规格文案：60 分钟 · ¥198
      serviceSpec(service = {}) {
        return `${service.duration} 分钟 · ¥${service.price}`;
      },
      // 秒 -> 剩余 mm:ss
      formatRemain(sec = 0) {
        const value = Math.max(0, sec);
        const minute = Math.floor(value / 60);
        const second = value % 60;
        return `剩余 ${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}`;
      },
    },
    // 监听器
    watch: {},
    // 计算属性
    computed: {
      // 房间状态标签
      stateTag() {
        if (this.status === 'occupied' || this.status === 'serving') {
          return { text: '使用中', color: '#2979ff', bg: '#e8f3ff' };
        }
        if (this.status === 'cleaning') {
          return { text: '清理中', color: '#ff7d00', bg: '#fff7e8' };
        }
        return { text: '空闲中', color: '#00b42a', bg: '#e8ffea' };
      },
      // 房间信息行
      roomRows() {
        return [
          { label: '房间类型', value: this.room.type },
          { label: '所属区域', value: this.room.area },
          { label: '房间设备', value: this.room.facilities },
        ];
      },
      // 空状态卡 + 提示条
      emptyState() {
        if (this.status === 'occupied') {
          return {
            icon: 'ordered-list',
            color: '#2979ff',
            bg: '#e8f3ff',
            title: '暂无服务记录',
            desc: '房间已占位，点击下方「添加服务」开始计时',
            tipIcon: 'exclamation-circle',
            tipColor: '#ff7d00',
            tipBg: '#fff7e8',
            tipText: '房间已占位但未开单，请及时添加服务项目',
          };
        }
        return {
          icon: 'home',
          color: '#00b42a',
          bg: '#e8ffea',
          title: '房间空闲中',
          desc: '点击下方「开单占房」选择技师并开始计时',
          tipIcon: 'check-circle',
          tipColor: '#00b42a',
          tipBg: '#e8ffea',
          tipText: '今日已完成 3 单，上次服务 14:20 结束',
        };
      },
      // 服务记录列表
      recordList() {
        return this.records.map((record) => ({ ...record, remainText: this.formatRemain(record.remainSec) }));
      },
      // 订单合计
      orderTotal() {
        return this.records.reduce((total, record) => total + record.price, 0).toFixed(2);
      },
      // 总剩余时间（取剩余最长的一条记录）
      maxRemainText() {
        const remainSec = this.records.reduce((max, record) => Math.max(max, record.remainSec), 0);
        return this.formatRemain(remainSec);
      },
      // 已选服务项目
      selectedService() {
        return this.services[this.selectedServiceIndex] || {};
      },
    },
  };
</script>
<style lang="scss">
  /* wot-ui 组件为 styleIsolation: shared，以下变量覆盖需写在非 scoped 作用域 */
  /* 主色对齐设计稿 #2979ff / #e8f3ff */
  .app {
    --wot-primary-6: #2979ff;
    --wot-primary-1: #e8f3ff;
  }
  .room-detail-navbar {
    --wot-navbar-bg: #ffffff;
    --wot-navbar-color: #1d2129;
    --wot-navbar-title-font-size: 17px;
    --wot-navbar-title-font-weight: 600;
  }
  .room-detail-card {
    --wot-card-bg: #ffffff;
    --wot-card-radius: 14px;
    --wot-card-shadow: none;
    --wot-card-margin-horizontal: 0;
    --wot-card-margin-bottom: 0;
    --wot-card-content-padding: 16px;
    --wot-card-content-color: #1d2129;
    --wot-card-content-font-size: 13px;
    --wot-card-content-line-height: 1.55;
  }
  .room-detail-card.room-detail-card--empty {
    --wot-card-content-padding: 28px 16px;
  }
  .room-detail-card.room-detail-card--record {
    --wot-card-content-padding: 14px;
  }
  /* 操作栏与弹窗底部的按钮等宽平分 */
  .room-detail-btn {
    flex: 1;
  }
  .room-detail-btn-change {
    flex: none;
    width: 100px;
  }
  .room-detail-popup {
    --wot-popup-radius: 20px;
  }
  /* 步骤条：设计稿为【序号圆 + 标题】一组，组间以连接线加箭头相连 */
  .room-detail-steps {
    display: flex;
    align-items: center;
    width: 100%;
    gap: 8px;
  }
  .room-detail-steps__item {
    display: flex;
    align-items: center;
    width: auto !important;
  }
  .room-detail-steps .wd-step__header {
    position: static;
  }
  .room-detail-steps .wd-step__indicator {
    width: 22px;
    height: 22px;
    border-radius: 11px;
    flex-shrink: 0;
    background: #f2f3f5;
  }
  .room-detail-steps .wd-step--process .wd-step__indicator,
  .room-detail-steps .wd-step--finished .wd-step__indicator {
    background: #2979ff;
  }
  .room-detail-steps .wd-step__num {
    font-size: 12px;
    font-weight: 600;
    line-height: 1;
    color: #86909c;
  }
  .room-detail-steps .wd-step--process .wd-step__num,
  .room-detail-steps .wd-step--finished .wd-step__num {
    color: #ffffff;
  }
  .room-detail-steps .wd-step__content {
    margin-top: 0;
    margin-left: 6px;
  }
  .room-detail-steps .wd-step__title {
    font-size: 14px;
    font-weight: 400;
    line-height: 1.4;
    color: #86909c;
  }
  .room-detail-steps .wd-step--process .wd-step__title,
  .room-detail-steps .wd-step--finished .wd-step__title {
    color: #1d2129;
    font-weight: 600;
  }
  /* 连接线由自定义元素承载，隐藏组件内置连接线 */
  .room-detail-steps .wd-step__line {
    display: none;
  }
  .room-detail-steps__link {
    display: flex;
    align-items: center;
    flex: 1;
  }
  .room-detail-steps__line {
    flex: 1;
    height: 1px;
    background: #e5e6eb;
  }
</style>
<style lang="scss" scoped>
  .app {
    min-height: 100vh;
    background: #f5f7fa;
  }
  .nav-split {
    height: 1px;
    background: #e5e6eb;
  }

  /* 页面内容（底部留出操作栏空间） */
  .detail {
    display: flex;
    flex-direction: column;
    gap: 14px;
    padding: 16px 16px calc(94px + env(safe-area-inset-bottom));
    box-sizing: border-box;
  }

  /* 房间信息卡 */
  .room {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  .room__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }
  .room__name {
    font-size: 20px;
    font-weight: 600;
    color: #1d2129;
  }
  .room__split {
    height: 1px;
    background: #e5e6eb;
  }
  .room__row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }
  .room__label {
    font-size: 13px;
    color: #86909c;
  }
  .room__value {
    font-size: 13px;
    color: #1d2129;
  }

  /* 房态标签（圆点 + 文字） */
  .state-tag {
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .state-tag__dot {
    width: 6px;
    height: 6px;
    border-radius: 3px;
    flex-shrink: 0;
  }

  /* 空状态卡 */
  .empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }
  .empty__icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 52px;
    height: 52px;
    border-radius: 26px;
  }
  .empty__title {
    font-size: 15px;
    font-weight: 500;
    color: #1d2129;
  }
  .empty__desc {
    font-size: 13px;
    color: #86909c;
    text-align: center;
  }

  /* 提示条 */
  .tip {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px;
    border-radius: 14px;
  }
  .tip--wide {
    gap: 10px;
    padding: 14px;
  }
  .tip__text {
    flex: 1;
    font-size: 12px;
    line-height: 1.5;
  }

  /* 订单合计卡 */
  .total {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 14px;
    background: #e8f3ff;
    border-radius: 14px;
  }
  .total__left {
    display: flex;
    flex-direction: column;
    gap: 4px;
    flex: 1;
  }
  .total__label {
    font-size: 12px;
    color: #86909c;
  }
  .total__amount {
    font-size: 24px;
    font-weight: 700;
    color: #2979ff;
  }

  /* 倒计时 */
  .countdown {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 8px;
    background: #e8f3ff;
    border-radius: 6px;
    flex-shrink: 0;
  }
  .countdown--large {
    gap: 6px;
    padding: 6px 12px;
    border-radius: 8px;
  }
  .countdown__text {
    font-size: 12px;
    font-weight: 600;
    color: #2979ff;
  }
  .countdown__text--large {
    font-size: 16px;
    font-weight: 700;
  }

  /* 列表标题 */
  .section-title {
    font-size: 15px;
    font-weight: 600;
    color: #1d2129;
  }

  /* 服务记录卡 */
  .record {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .record__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }
  .record__name {
    font-size: 15px;
    font-weight: 600;
    color: #1d2129;
  }
  .record__tech {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .record__tech-name {
    font-size: 13px;
    color: #86909c;
  }
  .record__spec {
    flex: 1;
    font-size: 13px;
    color: #86909c;
    text-align: right;
  }
  .record__foot {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }
  .record__price {
    font-size: 15px;
    font-weight: 600;
    color: #2979ff;
  }

  /* 操作栏 */
  .action-bar {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    background: #ffffff;
    padding-bottom: env(safe-area-inset-bottom);
    z-index: 10;
  }
  .action-bar__split {
    height: 1px;
    background: #e5e6eb;
  }
  .action-bar__body {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 12px 16px;
  }

  /* 添加服务弹窗 */
  .popup {
    display: flex;
    flex-direction: column;
    background: #ffffff;
  }
  .popup__head {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 14px;
    padding: 10px 20px 14px 20px;
  }
  .popup__handle {
    width: 40px;
    height: 4px;
    border-radius: 2px;
    background: #e5e6eb;
  }
  .popup__title {
    font-size: 17px;
    font-weight: 600;
    color: #1d2129;
  }
  .popup__body {
    max-height: 34vh;
  }
  .popup__section {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 0 20px 14px 20px;
  }
  .popup__section-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }
  .popup__section-title {
    font-size: 14px;
    font-weight: 600;
    color: #1d2129;
  }
  .popup__section-count {
    font-size: 12px;
    color: #86909c;
  }
  .popup__foot {
    background: #ffffff;
  }
  .popup__split {
    height: 1px;
    background: #e5e6eb;
  }
  .popup__buttons {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 12px 20px;
  }

  /* 服务项目项 */
  .service-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 11px 12px;
    background: #f2f3f5;
    border-radius: 10px;
  }
  .service-item--active {
    background: #e8f3ff;
  }
  .service-item__info {
    display: flex;
    flex-direction: column;
    gap: 3px;
    flex: 1;
  }
  .service-item__name {
    font-size: 15px;
    font-weight: 500;
    color: #1d2129;
  }
  .service-item__spec {
    font-size: 12px;
    color: #86909c;
  }

  /* 已选项目摘要 */
  .selected-summary {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 12px;
    background: #e8f3ff;
    border-radius: 10px;
  }
  .selected-summary__label {
    font-size: 12px;
    color: #86909c;
  }
  .selected-summary__row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }
  .selected-summary__name {
    font-size: 15px;
    font-weight: 600;
    color: #2979ff;
  }
  .selected-summary__spec {
    font-size: 13px;
    font-weight: 500;
    color: #2979ff;
  }

  /* 技师选择项 */
  .tech-item {
    display: flex;
    align-items: center;
    gap: 10px;
    height: 56px;
    padding: 0 12px;
    background: #f2f3f5;
    border-radius: 10px;
  }
  .tech-item--active {
    background: #e8f3ff;
  }
  .tech-item__avatar {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: 18px;
    flex-shrink: 0;
  }
  .tech-item__avatar-text {
    font-size: 15px;
    font-weight: 600;
  }
  .tech-item__info {
    display: flex;
    flex-direction: column;
    gap: 3px;
    flex: 1;
  }
  .tech-item__name {
    font-size: 15px;
    font-weight: 500;
    color: #1d2129;
  }
  .tech-item__desc {
    font-size: 12px;
    color: #86909c;
  }
</style>
