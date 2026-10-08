<template>
  <view class="page">
    <!-- 经营概览 -->
    <view class="block block--overview">
      <wd-segmented v-model:value="period" theme="card" :options="periodOptions" custom-class="period-tabs" custom-style="border: 1px solid #e5e6eb;"></wd-segmented>

      <view class="revenue">
        <view class="revenue__head">
          <text class="revenue__label">{{ revenue.label }}营业额</text>
          <view class="trend">
            <text class="trend__text">{{ revenue.trend }}</text>
          </view>
        </view>
        <view class="revenue__amount">
          <text class="revenue__symbol num">¥</text>
          <text class="revenue__value num">{{ revenue.amount }}</text>
        </view>
        <view class="revenue__chart">
          <view class="revenue__area" :style="'clip-path: ' + chartAreaClip + ';'"></view>
          <view class="revenue__line" :style="'clip-path: ' + chartLineClip + ';'"></view>
        </view>
      </view>

      <view class="metrics">
        <view class="metric">
          <text class="metric__label">{{ revenue.label }}订单</text>
          <view class="metric__value-row">
            <text class="metric__value num">{{ revenue.orders }}</text>
            <text class="metric__unit">单</text>
          </view>
          <view class="metric__progress">
            <wd-progress
              :percentage="revenue.orderRate"
              hide-text
              color="#2979ff"
              custom-class="order-progress"
            ></wd-progress>
            <view class="metric__foot">
              <text class="metric__foot-text">目标 {{ revenue.orderTarget }} 单</text>
              <text class="metric__foot-text">{{ revenue.orderRate }}%</text>
            </view>
          </view>
        </view>
        <view class="metric">
          <text class="metric__label">客单价</text>
          <view class="metric__value-row">
            <text class="metric__symbol num">¥</text>
            <text class="metric__value num">{{ revenue.avgPrice }}</text>
          </view>
          <view class="trend">
            <text class="trend__text">{{ revenue.avgTrend }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 快捷入口 -->
    <view class="block block--quick">
      <view class="quick" v-for="q in quickEntries" :key="q.key" @click="onQuickClick(q)">
        <wd-icon :name="q.icon" size="20px" color="#1d2129"></wd-icon>
        <text class="quick__label">{{ q.label }}</text>
      </view>
    </view>

    <!-- 房间状态 -->
    <view class="block block--section">
      <view class="section-head">
        <text class="section-title">房间状态</text>
        <text class="section-desc num">空闲 {{ roomStats.idle }} / 共 {{ roomStats.total }} 间</text>
      </view>

      <scroll-view class="chips" scroll-x :show-scrollbar="false">
        <view class="chips__inner">
          <view
            class="chip"
            v-for="c in roomFilters"
            :key="c.key"
            :class="{ 'chip--active': roomFilter === c.key }"
            @click="roomFilter = c.key"
          >
            <text class="chip__text" :class="{ 'chip__text--active': roomFilter === c.key }">{{ c.label }}</text>
          </view>
        </view>
      </scroll-view>

      <scroll-view class="hscroll" scroll-x :show-scrollbar="false">
        <view class="hscroll__inner">
          <view class="room" v-for="r in filteredRooms" :key="r.id" @click="onRoomClick(r)">
            <view class="room__head">
              <text class="room__name">{{ r.name }}</text>
              <wd-tag round size="small" variant="light" :color="r.tagColor" :bg-color="r.tagBg" :custom-style="tagStyle">{{ r.status }}</wd-tag>
            </view>
            <text class="room__sub" v-if="r.sub">{{ r.sub }}</text>
            <view class="room__foot" :class="{ 'room__foot--col': r.footCol }">
              <view class="room__price-row" v-if="r.price">
                <text class="room__price num">{{ r.price }}</text>
                <text class="room__duration num"> / {{ r.duration }}</text>
                <wd-circle
                  class="room-ring"
                  :model-value="r.progress"
                  :size="38"
                  :stroke-width="3.4"
                  color="#2979ff"
                  layer-color="#e8f3ff"
                  :text="r.progress + '%'"
                ></wd-circle>
              </view>
              <template v-else>
                <text class="room__note">{{ r.note }}</text>
                <wd-button round size="mini" type="primary" variant="soft" :custom-style="pillStyle" @click.stop="onRoomAction(r)">{{ r.action }}</wd-button>
              </template>
            </view>
          </view>
        </view>
      </scroll-view>
    </view>

    <!-- 技师排班 -->
    <view class="block block--section">
      <view class="section-head">
        <text class="section-title">技师排班</text>
        <text class="section-desc num">在岗 {{ techStats.onDuty }}/{{ techStats.total }}</text>
      </view>

      <scroll-view class="chips" scroll-x :show-scrollbar="false">
        <view class="chips__inner">
          <view
            class="chip"
            v-for="c in techFilters"
            :key="c.key"
            :class="{ 'chip--active': techFilter === c.key }"
            @click="techFilter = c.key"
          >
            <text class="chip__text" :class="{ 'chip__text--active': techFilter === c.key }">{{ c.label }}</text>
          </view>
        </view>
      </scroll-view>

      <scroll-view class="hscroll" scroll-x :show-scrollbar="false">
        <view class="hscroll__inner">
          <view class="tech" v-for="t in filteredTechs" :key="t.name" @click="onTechClick(t)">
            <view class="tech__avatar">
              <wd-avatar round size="56px" :text="t.initial" custom-style="background: #e8f3ff; color: #2979ff; font-size: 23px; font-weight: 600; border: 2px solid #ffffff;"></wd-avatar>
              <view class="tech__dot" :style="{ background: t.dot }"></view>
            </view>
            <text class="tech__name">{{ t.name }}</text>
            <text class="tech__skill">{{ t.skill }}</text>
            <view class="tech__foot">
              <text class="tech__count num">{{ t.count }} 单</text>
              <text class="tech__place">{{ t.place }}</text>
            </view>
          </view>
        </view>
      </scroll-view>
    </view>
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
        countdownTimer: null,
        period: '今日',
        roomFilter: 'all',
        techFilter: 'all',
        tagStyle: 'padding: 3px 8px; border-radius: 999px; font-size: 11px; font-weight: 600; line-height: 1.3;',
        pillStyle: 'height: 30px; min-height: 30px; padding: 0 11px; border-radius: 999px; font-size: 12px; font-weight: 600; line-height: 1;',
        periodOptions: ['今日', '本周', '本月'],
        quickEntries: [
          { key: 'order', icon: 'idcard', label: '开单收银' },
          { key: 'schedule', icon: 'calendar-line', label: '技师排班' },
          { key: 'member', icon: 'tags', label: '会员营销' },
          { key: 'stock', icon: 'storage', label: '库存盘点' },
        ],
        roomFilters: [
          { key: 'all', label: '全部' },
          { key: '服务中', label: '服务中' },
          { key: '空闲', label: '空闲' },
          { key: '待清洁', label: '待清洁' },
          { key: '维护中', label: '维护中' },
        ],
        techFilters: [
          { key: 'all', label: '全部' },
          { key: '服务中', label: '服务中' },
          { key: '可排班', label: '可排班' },
          { key: '休息中', label: '休息中' },
        ],
        // 折线走势数据为设计稿曲线在 313x52 画布内的相对高度百分比
        revenueMap: {
          今日: {
            label: '今日',
            amount: '12,860',
            trend: '较昨日 +8.6%',
            orders: 37,
            orderTarget: 60,
            avgPrice: 347,
            avgTrend: '较昨日 +3.1%',
            chart: [80.96, 72.5, 92.31, 61.15, 69.62, 48.27, 56.73, 38.27, 32.69, 44.04, 21.35, 10, 0, 12.69],
          },
          本周: {
            label: '本周',
            amount: '86,420',
            trend: '较上周 +6.2%',
            orders: 248,
            orderTarget: 300,
            avgPrice: 348,
            avgTrend: '较上周 +1.8%',
            chart: [74.2, 66.3, 84.6, 55.8, 63.5, 43.1, 51.9, 33.4, 27.7, 39.2, 17.3, 6.4, 0, 8.7],
          },
          本月: {
            label: '本月',
            amount: '342,180',
            trend: '较上月 +9.4%',
            orders: 968,
            orderTarget: 1200,
            avgPrice: 353,
            avgTrend: '较上月 +2.6%',
            chart: [78.5, 70.1, 88.3, 58.2, 66.4, 45.3, 54.2, 35.6, 29.8, 41.5, 18.9, 7.5, 0, 10.2],
          },
        },
        rooms: [
          { id: '101', name: '101 · 泰式厅', status: '服务中', sub: '林淑华 · 剩 22 分钟', remainSec: 22 * 60, price: '¥398', duration: '90分钟', progress: 76 },
          { id: '102', name: '102 · 中式厅', status: '服务中', sub: '周文博 · 剩 48 分钟', remainSec: 48 * 60, price: '¥268', duration: '60分钟', progress: 20 },
          { id: '103', name: '103 · 养生厅', status: '服务中', sub: '陈可欣 · 剩 11 分钟', remainSec: 11 * 60, price: '¥188', duration: '45分钟', progress: 76 },
          { id: '201', name: '201 · VIP 套房', status: '空闲', note: '可立即安排客人', action: '指派' },
          { id: '202', name: '202 · 日式厅', status: '空闲', note: '可立即安排客人', action: '指派' },
          { id: '203', name: '203 · 足疗厅', status: '空闲', note: '可立即安排客人', action: '指派' },
          { id: '301', name: '301 · 情侣厅', status: '空闲', note: '可立即安排客人', action: '指派' },
          { id: 'B1', name: 'B1 · 员工休息室', status: '待清洁', sub: '需完成清洁消毒', note: '上一单：韩式松骨 60 分钟', action: '去清洁', footCol: true },
          { id: '302', name: '302 · 泰式厅', status: '待清洁', sub: '需完成清洁消毒', note: '上一单：足底按摩 45 分钟', action: '去清洁', footCol: true },
          { id: '303', name: '303 · 头疗室', status: '维护中', sub: '暂停接待', note: '热水器故障 · 预计明日修复', action: '报修', footCol: true },
        ],
        techs: [
          { name: '林淑华', initial: '林', skill: '泰式精油', count: 6, place: '101 · 泰式厅', status: '服务中', dot: '#00b42a' },
          { name: '周文博', initial: '周', skill: '中式足底', count: 5, place: '102 · 中式厅', status: '服务中', dot: '#00b42a' },
          { name: '陈可欣', initial: '陈', skill: '肩颈理疗', count: 7, place: '103 · 养生厅', status: '服务中', dot: '#00b42a' },
          { name: '苏雅雯', initial: '苏', skill: '韩式松骨', count: 4, place: '可排班', status: '可排班', dot: '#86909c' },
          { name: '何俊宇', initial: '何', skill: '足部反射', count: 3, place: '可排班', status: '可排班', dot: '#86909c' },
          { name: '郑清越', initial: '郑', skill: '头疗养生', count: 0, place: '休息中', status: '休息中', dot: '#ff7d00' },
          { name: '马晓琳', initial: '马', skill: '香薰推背', count: 5, place: '可排班', status: '可排班', dot: '#86909c' },
          { name: '黄立诚', initial: '黄', skill: '运动康复', count: 2, place: '休息中', status: '休息中', dot: '#ff7d00' },
        ],
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
        this.startCountdown();
      },
      startCountdown() {
        if (this.countdownTimer) return;
        this.countdownTimer = setInterval(() => {
          this.rooms.forEach((room) => {
            if (room.remainSec > 0) room.remainSec -= 1;
          });
        }, 1000);
      },
      stopCountdown() {
        if (this.countdownTimer) {
          clearInterval(this.countdownTimer);
          this.countdownTimer = null;
        }
      },
      remainMinute(room) {
        return Math.max(0, Math.ceil((room.remainSec || 0) / 60));
      },
      statusMeta(status) {
        if (status === '服务中') return { tagColor: '#2979ff', tagBg: '#e8f3ff' };
        if (status === '空闲') return { tagColor: '#86909c', tagBg: '#e8ffea' };
        if (status === '待清洁') return { tagColor: '#ff7d00', tagBg: '#fff7e8' };
        return { tagColor: '#f53f3f', tagBg: '#ffece8' };
      },
      onQuickClick(item) {
        vk.toast(`打开：${item.label}`);
      },
      onRoomClick(room) {
        vk.toast(`打开：${room.name}`);
      },
      onRoomAction(room) {
        vk.toast(`${room.name} · ${room.action}`);
      },
      onTechClick(tech) {
        vk.toast(`打开：${tech.name}`);
      },
    },
    // 监听器
    watch: {},
    // 计算属性
    computed: {
      revenue() {
        const source = this.revenueMap[this.period];
        return {
          label: source.label,
          amount: source.amount,
          trend: source.trend,
          orders: source.orders,
          orderTarget: source.orderTarget,
          orderRate: Math.round((source.orders / source.orderTarget) * 100),
          avgPrice: source.avgPrice,
          avgTrend: source.avgTrend,
          chart: source.chart,
        };
      },
      // 概览卡内的面积走势图：折线数据转为百分比坐标，用 clip-path 还原设计稿的面积 + 描边
      chartPoints() {
        const values = this.revenue.chart;
        const count = values.length - 1;
        return values.map((value, index) => ({
          x: (index / count) * 100,
          y: 100 - value,
        }));
      },
      chartAreaClip() {
        const points = this.chartPoints;
        const top = points.map((p) => `${p.x.toFixed(2)}% ${p.y.toFixed(2)}%`).join(', ');
        return `polygon(${top}, 100% 100%, 0% 100%)`;
      },
      chartLineClip() {
        const points = this.chartPoints;
        const thickness = 3.85;
        const top = points.map((p) => `${p.x.toFixed(2)}% ${p.y.toFixed(2)}%`).join(', ');
        const bottom = points
          .slice()
          .reverse()
          .map((p) => `${p.x.toFixed(2)}% ${Math.min(100, p.y + thickness).toFixed(2)}%`)
          .join(', ');
        return `polygon(${top}, ${bottom})`;
      },
      roomList() {
        return this.rooms.map((room) => {
          const meta = this.statusMeta(room.status);
          return {
            ...room,
            tagColor: meta.tagColor,
            tagBg: meta.tagBg,
            sub: room.sub ? room.sub.replace(/剩 \d+ 分钟/, `剩 ${this.remainMinute(room)} 分钟`) : '',
          };
        });
      },
      filteredRooms() {
        if (this.roomFilter === 'all') return this.roomList;
        return this.roomList.filter((room) => room.status === this.roomFilter);
      },
      roomStats() {
        return {
          total: this.rooms.length,
          idle: this.rooms.filter((room) => room.status === '空闲').length,
        };
      },
      filteredTechs() {
        if (this.techFilter === 'all') return this.techs;
        return this.techs.filter((tech) => tech.status === this.techFilter);
      },
      techStats() {
        return {
          total: this.techs.length,
          onDuty: this.techs.filter((tech) => tech.status !== '休息中').length,
        };
      },
    },
  };
</script>
<style lang="scss">
  /* wot-ui 组件为 styleIsolation: shared，以下变量覆盖需写在非 scoped 作用域 */
  /* 主色对齐设计稿 #2979ff / #e8f3ff */
  .page {
    --wot-primary-6: #2979ff;
    --wot-primary-1: #e8f3ff;
  }
  .period-tabs {
    --wot-segmented-bg: #ffffff;
    --wot-segmented-border-width: 0px;
    --wot-segmented-padding: 4px;
    --wot-segmented-radius: 999px;
    --wot-segmented-item-padding: 6px 18px;
    --wot-segmented-item-font-size: 13px;
    --wot-segmented-item-line-height: 20px;
    --wot-segmented-item-font-weight: 500;
    --wot-segmented-item-font-weight-active: 600;
    --wot-segmented-item-color: #86909c;
    --wot-segmented-item-color-active: #ffffff;
    --wot-segmented-item-bg-active: #2979ff;
    justify-content: space-between;
  }
  .period-tabs .wd-segmented__item {
    flex: 0 0 auto;
  }
  .order-progress {
    --wot-progress-bg: #e8f3ff;
    --wot-progress-bar-height: 6px;
    --wot-progress-height: 6px;
    --wot-progress-radius: 999px;
  }
  .room-ring {
    --wot-circle-text-font-size: 9px;
    --wot-circle-text-color: #1d2129;
    flex-shrink: 0;
  }
</style>
<style lang="scss" scoped>
  .page {
    min-height: 100vh;
    box-sizing: border-box;
    background: #f5f7fa;
    padding-bottom: calc(16px + env(safe-area-inset-bottom));
  }
  .block {
    padding: 12px;
    box-sizing: border-box;
  }
  .block--overview {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .block--quick {
    display: flex;
    gap: 8px;
    padding-top: 10px;
    padding-bottom: 10px;
  }
  .block--section {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .num {
    font-family: 'JetBrains Mono', 'DIN Alternate', ui-monospace, monospace;
  }

  /* 经营概览 */
  .revenue {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 19px 19px 9px;
    box-sizing: border-box;
    border: 1px solid #e5e6eb;
    border-radius: 18px;
    background: linear-gradient(160deg, #e8f3ff 0%, #ffffff 62%);
  }
  .revenue__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .revenue__label {
    font-size: 12px;
    color: #86909c;
  }
  .trend {
    display: flex;
    align-items: center;
    padding: 3px 7px;
    border-radius: 999px;
    background: #e8f3ff;
  }
  .trend__text {
    font-size: 11.5px;
    font-weight: 600;
    color: #00b42a;
  }
  .revenue__amount {
    display: flex;
    align-items: flex-end;
    gap: 3px;
  }
  .revenue__symbol {
    font-size: 14px;
    font-weight: 500;
    line-height: 1.1;
    color: #86909c;
  }
  .revenue__value {
    font-size: 40px;
    font-weight: 600;
    line-height: 1.1;
    letter-spacing: -0.8px;
    color: #1d2129;
  }
  .revenue__chart {
    position: relative;
    height: 52px;
  }
  .revenue__area {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-image: linear-gradient(180deg, #2979ff 0%, #e8f3ff 100%);
  }
  .revenue__line {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #2979ff;
  }

  .metrics {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .metric {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 15px;
    box-sizing: border-box;
    border: 1px solid #e5e6eb;
    border-radius: 18px;
    background: #ffffff;
  }
  .metric__label {
    font-size: 12px;
    color: #86909c;
  }
  .metric__value-row {
    display: flex;
    align-items: flex-end;
    gap: 2px;
  }
  .metric__symbol {
    font-size: 14px;
    font-weight: 500;
    line-height: 1.1;
    color: #86909c;
  }
  .metric__value {
    font-size: 26px;
    font-weight: 600;
    line-height: 1.1;
    letter-spacing: -0.52px;
    color: #1d2129;
  }
  .metric__unit {
    font-size: 14px;
    font-weight: 500;
    line-height: 1.1;
    color: #86909c;
  }
  .metric__progress {
    display: flex;
    flex-direction: column;
    gap: 7px;
  }
  .metric__foot {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .metric__foot-text {
    font-size: 11.5px;
    color: #86909c;
  }

  /* 快捷入口 */
  .quick {
    flex: 1;
    height: 72px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 6px;
    box-sizing: border-box;
    border: 1px solid #e5e6eb;
    border-radius: 14px;
    background: #ffffff;
  }
  .quick__label {
    font-size: 11.5px;
    color: #86909c;
  }

  /* 通用标题行 */
  .section-head {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
  }
  .section-title {
    font-size: 17px;
    font-weight: 600;
    color: #1d2129;
  }
  .section-desc {
    font-size: 12px;
    color: #86909c;
  }

  /* 筛选标签 */
  .chips {
    width: 100%;
    white-space: nowrap;
  }
  .chips__inner {
    display: flex;
    gap: 8px;
  }
  .chip {
    flex-shrink: 0;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 14px;
    box-sizing: border-box;
    border: 1px solid #e5e6eb;
    border-radius: 999px;
    background: #ffffff;
  }
  .chip--active {
    border-color: #2979ff;
    background: #2979ff;
  }
  .chip__text {
    font-size: 12.5px;
    color: #86909c;
  }
  .chip__text--active {
    color: #ffffff;
  }

  /* 横向滚动列表 */
  .hscroll {
    width: 100%;
    white-space: nowrap;
  }
  .hscroll__inner {
    display: flex;
    gap: 10px;
  }

  /* 房间卡 */
  .room {
    flex-shrink: 0;
    width: 200px;
    height: 150px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: 8px;
    padding: 12px 14px;
    box-sizing: border-box;
    border: 1px solid #e5e6eb;
    border-radius: 18px;
    background: #ffffff;
  }
  .room__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }
  .room__name {
    font-size: 15px;
    font-weight: 600;
    color: #1d2129;
  }
  .room__sub {
    font-size: 12px;
    color: #86909c;
  }
  .room__foot {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 6px;
    padding-top: 11px;
    border-top: 1px solid #e5e6eb;
  }
  .room__foot--col {
    flex-direction: column;
    align-items: flex-start;
    justify-content: space-between;
  }
  .room__price-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    gap: 6px;
  }
  .room__price {
    font-size: 15px;
    font-weight: 600;
    color: #1d2129;
  }
  .room__duration {
    font-size: 15px;
    font-weight: 600;
    color: #1d2129;
  }
  .room__note {
    font-size: 12px;
    color: #86909c;
  }

  /* 技师卡 */
  .tech {
    flex-shrink: 0;
    width: 150px;
    min-height: 181px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    padding: 12px 14px;
    box-sizing: border-box;
    border: 1px solid #e5e6eb;
    border-radius: 18px;
    background: #ffffff;
  }
  .tech__avatar {
    position: relative;
  }
  .tech__dot {
    position: absolute;
    right: 0;
    bottom: 0;
    width: 14px;
    height: 14px;
    border: 2px solid #ffffff;
    border-radius: 50%;
  }
  .tech__name {
    font-size: 14px;
    font-weight: 600;
    color: #1d2129;
    text-align: center;
  }
  .tech__skill {
    font-size: 11px;
    color: #86909c;
    text-align: center;
  }
  .tech__foot {
    display: flex;
    flex-direction: column;
    gap: 2px;
    width: 100%;
    margin-top: 8px;
    padding-top: 8px;
    border-top: 1px solid #e5e6eb;
  }
  .tech__count {
    font-size: 13px;
    font-weight: 600;
    color: #1d2129;
    text-align: center;
  }
  .tech__place {
    font-size: 11px;
    color: #86909c;
    text-align: center;
  }
</style>