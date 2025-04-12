<template>
  <div class="dashboard-container">
    <el-row :gutter="20">
      <!-- 我的消息 -->
      <el-col :span="8">
        <el-card shadow="hover">
          <div slot="header">
            <i class="el-icon-bell"></i> 我的消息
          </div>
          <el-timeline>
            <el-timeline-item
                v-for="(item, index) in messages"
                :key="index"
                :timestamp="item.time"
                placement="top"
            >
              {{ item.content }}
            </el-timeline-item>
          </el-timeline>
          <el-button type="text" @click="goTo('notifications')">查看详情</el-button>
        </el-card>
      </el-col>

      <!-- 我的待办 -->
      <el-col :span="8">
        <el-card shadow="hover">
          <div slot="header">
            <i class="el-icon-date"></i> 我的待办
          </div>
          <el-timeline>
            <el-timeline-item
                v-for="(item, index) in tasks"
                :key="index"
                :timestamp="item.time"
                placement="top"
            >
              {{ item.title }}
            </el-timeline-item>
          </el-timeline>
          <el-button type="text" @click="goTo('tasks')">查看详情</el-button>
        </el-card>
      </el-col>

      <!-- 我的财务 -->
      <el-col :span="8">
        <el-card shadow="hover">
          <div slot="header">
            <i class="el-icon-s-finance"></i> 我的财务
          </div>
          <div ref="financeChart" style="height: 200px"></div>
          <el-button type="text" @click="goTo('finance')">查看详情</el-button>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px">
      <!-- 我的场地 -->
      <el-col :span="12">
        <el-card shadow="hover">
          <div slot="header">
            <i class="el-icon-location"></i> 我的场地
          </div>
          <p>场地编号：001</p>
          <p>预约时间：2025-03-03 16:00 - 17:00</p>
          <el-button type="text" @click="goTo('venue')">查看详情</el-button>
        </el-card>
      </el-col>

      <!-- 我的器材 -->
      <el-col :span="12">
        <el-card shadow="hover">
          <div slot="header">
            <i class="el-icon-shopping-cart-full"></i> 我的器材
          </div>
          <p>篮球 x 9，足球 x 3</p>
          <p>归还状态：未归还</p>
          <el-button type="text" @click="goTo('equipment')">查看详情</el-button>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px">
      <!-- 我的赛事 -->
      <el-col :span="12">
        <el-card shadow="hover">
          <div slot="header">
            <i class="el-icon-trophy"></i> 我的赛事
          </div>
          <p>赛事项目：足球</p>
          <p>时间：2026-01-01 12:00 - 13:00</p>
          <el-button type="text" @click="goTo('events')">查看详情</el-button>
        </el-card>
      </el-col>

      <!-- 我的关注 -->
      <el-col :span="12">
        <el-card shadow="hover">
          <div slot="header">
            <i class="el-icon-star-on"></i> 我的关注
          </div>
          <p>赛事：篮球比赛</p>
          <p>状态：已结束</p>
          <el-button type="text" @click="goTo('follows')">查看详情</el-button>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import * as echarts from 'echarts';

export default {
  name: 'DashboardPage',
  data() {
    return {
      messages: [
        { content: '您有一个场地预约申请待审批', time: '10分钟前' },
        { content: '系统维护通知：本周日凌晨2点~4点', time: '1小时前' },
        { content: '您的场地申请已审批通过', time: '昨天' }
      ],
      tasks: [
        { title: '篮球馆卫生检查', time: '今天 14:00' },
        { title: '器材采购审批', time: '明天 09:30' },
        { title: '体育赛事策划会议', time: '周三 10:00' }
      ]
    };
  },
  mounted() {
    const chart = echarts.init(this.$refs.financeChart);
    chart.setOption({
      tooltip: {},
      legend: { data: ['余额', '花费'] },
      xAxis: { data: ['1月', '2月', '3月'] },
      yAxis: {},
      series: [
        { name: '余额', type: 'bar', data: [500, 400, 300] },
        { name: '花费', type: 'bar', data: [100, 200, 300] }
      ]
    });
  },
  methods: {
    goTo(module) {
      const map = {
        notifications: '/notifications',
        tasks: '/tasks',
        venue: '/venue/my',
        equipment: '/equipment/my',
        events: '/events/my',
        follows: '/events/following',
        finance: '/finance'
      };
      this.$router.push(map[module] || '/dashboard');
    }
  }
};
</script>

<style scoped>
.dashboard-container {
  padding: 20px;
  background: #f4f6f9;
}
</style>
