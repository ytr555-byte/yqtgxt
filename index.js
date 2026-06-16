	import {
		createRouter,
		createWebHashHistory
	} from 'vue-router'
	import news from '@/views/news/list'
	import cheweixinxi from '@/views/cheweixinxi/list'
	import systemintro from '@/views/systemintro/list'
	import yanshijilu from '@/views/yanshijilu/list'
	import chat from '@/views/chat/list'
	import yonghu from '@/views/yonghu/list'
	import chuchangxinxi from '@/views/chuchangxinxi/list'
	import cheweiyuyue from '@/views/cheweiyuyue/list'
	import ruchangxinxi from '@/views/ruchangxinxi/list'
	import quxiaojilu from '@/views/quxiaojilu/list'
	import config from '@/views/config/list'
	import users from '@/views/users/list'
	import usersCenter from '@/views/users/center'

export const routes = [{
		path: '/login',
		name: 'login',
		component: () => import('../views/login.vue')
	},{
		path: '/',
		name: '首页',
		component: () => import('../views/index'),
		children: [{
			path: '/',
			name: '首页',
			component: () => import('../views/HomeView.vue'),
			meta: {
				affix: true
			}
		}, {
			path: '/updatepassword',
			name: '修改密码',
			component: () => import('../views/updatepassword.vue')
		}
		
		,{
			path: '/usersCenter',
			name: '管理员个人中心',
			component: usersCenter
		}
		,{
			path: '/news',
			name: '新闻资讯',
			component: news
		}
		,{
			path: '/cheweixinxi',
			name: '车位信息',
			component: cheweixinxi
		}
		,{
			path: '/systemintro',
			name: '网站介绍',
			component: systemintro
		}
		,{
			path: '/yanshijilu',
			name: '延时记录',
			component: yanshijilu
		}
		,{
			path: '/chat',
			name: '客服聊天',
			component: chat
		}
		,{
			path: '/yonghu',
			name: '用户',
			component: yonghu
		}
		,{
			path: '/chuchangxinxi',
			name: '出场信息',
			component: chuchangxinxi
		}
		,{
			path: '/cheweiyuyue',
			name: '车位预约',
			component: cheweiyuyue
		}
		,{
			path: '/ruchangxinxi',
			name: '入场信息',
			component: ruchangxinxi
		}
		,{
			path: '/quxiaojilu',
			name: '取消记录',
			component: quxiaojilu
		}
		,{
			path: '/config',
			name: '轮播图',
			component: config
		}
		,{
			path: '/users',
			name: '管理员',
			component: users
		}
		]
	},
]

const router = createRouter({
	history: createWebHashHistory(process.env.BASE_URL),
	routes
})

export default router
