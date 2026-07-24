<template>
  <view class="app app-bg">
    <!-- 页面内容开始 -->
    <view class="list-page">
      <!--头部开始 -->
      <view class="list-head">
        <view class="list-search" @click="listSearch.focus = true">
          <!-- 快捷搜索 -->
          <u-search
            v-model="queryForm1.formData[listSearch.key]"
            :focus="listSearch.focus"
            @blur="listSearch.focus = false"
            :placeholder="listSearch.placeholder"
            :show-action="false"
            input-align="center"
            class="search-input"
            shape="square"
            @search="search"
            @clear="search"
          ></u-search>
        </view>
        <!-- 总记录数 -->
        <view class="total-desc">
          共 <text class="total-num">{{ data.total }}</text> 条记录
        </view>
      </view>
      <!--头部结束 -->

      <!--无内容时 -->
      <view v-if="data.list.length == 0" style="padding: 40% 0 80% 0">
        <u-empty v-if="loading" text="查询中..." mode="search"></u-empty>
        <u-empty v-else text="暂无内容" mode="list"></u-empty>
      </view>
      <!--有内容时开始-->
      <view v-else class="list-main">
        <view v-for="(item, index) in data.list" :key="item._id">
          <!-- ****************** 自定义item的内容开始 ****************** -->

          <view class="list-item">
            <view class="content" @click.stop="itemClick(item)"> {{ index + 1 }}: {_id: {{ item._id.substring(20) }}, money: {{ item.money }}} 此处为你自己写的UI样式 </view>
          </view>

          <!-- ****************** 自定义item的内容结束 ****************** -->
        </view>
        <!-- 加载更多-->
        <u-loadmore :status="state.loadmore" bg-color="var(--bgcolor)" margin-bottom="30" @loadmore="nextPage" />
      </view>
      <!--有内容时结束-->
    </view>

    <!-- 页面内容结束 -->
  </view>
</template>

<script>
  let vk = uni.vk;
  let originalForms = {}; // 表单初始化数据
  export default {
    data() {
      // 页面数据变量
      return {
        // 获取list数据的云函数请求路径
        url: 'template/pub.db.getList',
        // init请求返回的数据
        data: {
          list: [],
          total: '-',
          hasMore: true, // 是否还有下一页数据
        },
        // 列表查询请求数据
        queryForm1: {
          // 分页数据
          pagination: {
            pageIndex: 1, //当前页码
            pageSize: 20, //每页显示数量
          },
          // 查询表单数据源，可在此设置默认值
          formData: {},
          // 查询匹配规则 fieldName:指定数据库字段名,不填默认等于key
          columns: [{ key: 'no', mode: '%%' }],
          // 排序规则
          sortRule: [
            { name: '_add_time', type: 'desc' }, // desc降序 asc升序
          ],
        },
        // 列表搜索框 key 可以是 queryForm1.columns 中的任意1个key
        listSearch: { key: 'no', placeholder: '输入单号搜索', focus: false },
        // 页面状态
        state: {
          loadmore: 'loading', // loadmore的显示状态
        },
        loading: false, // 是否请求中
        scrollTop: 0,
      };
    },
    onPageScroll(e) {
      this.scrollTop = e.scrollTop;
    },
    // 监听 - 页面每次【加载时】执行(如：前进)
    onLoad(options = {}) {
      vk = uni.vk;
      this.options = options;
      this.init(options);
    },
    // 监听 - 页面【首次渲染完成时】执行。注意如果渲染速度快，会在页面进入动画完成前触发
    onReady() {},
    // 监听 - 页面每次【显示时】执行(如：前进和返回) (页面每次出现在屏幕上都触发，包括从下级页面点返回露出当前页面)
    onShow() {},
    // 监听 - 页面每次【隐藏时】执行(如：返回)
    onHide() {},
    // 监听 - 页面下拉刷新
    onPullDownRefresh() {
      setTimeout(() => {
        uni.stopPullDownRefresh();
      }, 1000);
    },
    // 监听 - 页面触底部
    onReachBottom() {
      this.nextPage();
    },
    // 函数
    methods: {
      // 页面数据初始化函数
      init(options) {
        console.log('init: ', options);
        // 拷贝一份表单的初始值
        originalForms['queryForm1'] = vk.pubfn.copyObject(this.queryForm1.formData);

        // 查询
        this.search();
      },
      // 搜索查询
      search(e) {
        this.queryForm1.pagination.pageIndex = 1;
        this.data.pageKey = true;
        this.getList();
      },
      // 加载下一页数据
      nextPage() {
        if (this.state.loadmore == 'loadmore') {
          this.state.loadmore = 'loading';
          this.queryForm1.pagination.pageIndex++;
          this.getList();
        }
      },
      // 获取list数据
      getList(obj = {}) {
        vk.pubfn.getListData2({
          that: this,
          url: this.url,
          success: obj.success,
        });
      },
      itemClick(item) {
        console.log('点击', item);
        vk.toast('点击' + item._id.substring(20));
      },
    },
    // 计算属性
    computed: {},
  };
</script>
<style lang="scss" scoped>
  page {
    background-color: #f8f8f8;
  }

  /* list主结构开始 */
  .list-page {
    /* 头部 */
    .list-head {
      .total-desc {
        font-size: 14px;
        color: #999;
        padding: 10px 15px 0px 15px;
        padding-bottom: 0;
        line-height: 26px;
      }

      .total-num {
        font-weight: bold;
        color: black;
        font-size: 13px;
        margin-left: 5px;
        margin-right: 5px;
      }

      .list-search {
        background-color: #ffffff;
        padding: 10px 15px;
      }
    }

    .list-main {
      padding: 0px 0px 10px 0px;
    }
  }

  /* list主结构结束 */

  /* list-item开始 */
  .list-item {
    margin: 10px;

    > .content {
      background-color: #ffffff;
      border-bottom: 1px solid #f3f3f3;
      padding: 10px 15px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-radius: 8px;
    }
  }

  /* list-item结束 */
</style>
