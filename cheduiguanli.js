// routes/cheduiguanli.js
const express = require('express')
const router = express.Router()
const pool = require('../config/db')

// 生成车队编号
const generateCheduiBianhao = async () => {
  const [rows] = await pool.execute(
    "SELECT cheduibianhao FROM cheduiguanli ORDER BY id DESC LIMIT 1"
  )
  if (rows.length === 0) {
    return 'CD' + new Date().getFullYear() + '0001'
  }
  const lastNum = parseInt(rows[0].cheduibianhao.slice(-4))
  const newNum = (lastNum + 1).toString().padStart(4, '0')
  return `CD${new Date().getFullYear()}${newNum}`
}

// 分页查询列表
router.get('/page', async (req, res) => {
  try {
    let { page = 1, limit = 15, cheduimingcheng, cheduifuzeren, sfsh, sort = 'id', order = 'desc' } = req.query
    page = parseInt(page)
    limit = parseInt(limit)
    
    let whereConditions = []
    let params = []
    
    // 车队名称模糊搜索
    if (cheduimingcheng && cheduimingcheng.trim()) {
      whereConditions.push('cheduimingcheng LIKE ?')
      params.push(`%${cheduimingcheng}%`)
    }
    // 负责人模糊搜索
    if (cheduifuzeren && cheduifuzeren.trim()) {
      whereConditions.push('cheduifuzeren LIKE ?')
      params.push(`%${cheduifuzeren}%`)
    }
    // 审核状态精确搜索
    if (sfsh && sfsh.trim()) {
      whereConditions.push('sfsh = ?')
      params.push(sfsh)
    }
    
    const whereClause = whereConditions.length ? `WHERE ${whereConditions.join(' AND ')}` : ''
    const offset = (page - 1) * limit
    
    // 查询总数
    const [countResult] = await pool.execute(
      `SELECT COUNT(*) as total FROM cheduiguanli ${whereClause}`,
      params
    )
    const total = countResult[0].total
    
    // 查询数据
    const [rows] = await pool.execute(
      `SELECT * FROM cheduiguanli ${whereClause} ORDER BY ${sort} ${order} LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    )
    
    // 为每个车队统计车辆和成员数量
    for (let row of rows) {
      const [carCount] = await pool.execute(
        'SELECT COUNT(*) as count FROM cheliangguanli WHERE cheduibianhao = ?',
        [row.cheduibianhao]
      )
      const [memberCount] = await pool.execute(
        'SELECT COUNT(*) as count FROM cheduichengyuan WHERE cheduibianhao = ?',
        [row.cheduibianhao]
      )
      row.cheduishuliang = carCount[0].count
      row.chengyuanshuliang = memberCount[0].count
    }
    
    res.json({
      code: 0,
      data: {
        list: rows,
        total: total
      }
    })
  } catch (error) {
    console.error(error)
    res.json({ code: 500, msg: '查询失败' })
  }
})

//  获取单个详情
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM cheduiguanli WHERE id = ?',
      [req.params.id]
    )
    
    if (rows.length === 0) {
      return res.json({ code: 404, msg: '车队不存在' })
    }
    
    res.json({
      code: 0,
      data: rows[0]
    })
  } catch (error) {
    console.error(error)
    res.json({ code: 500, msg: '查询失败' })
  }
})

// 新增车队
router.post('/save', async (req, res) => {
  try {
    const {
      cheduimingcheng,
      cheduifuzeren,
      lianxidianhua,
      chuangjianshijian,
      beizhu
    } = req.body
    
    // 验证必填字段
    if (!cheduimingcheng || !cheduimingcheng.trim()) {
      return res.json({ code: 400, msg: '车队名称不能为空' })
    }
    if (!cheduifuzeren || !cheduifuzeren.trim()) {
      return res.json({ code: 400, msg: '负责人不能为空' })
    }
    if (!lianxidianhua || !lianxidianhua.trim()) {
      return res.json({ code: 400, msg: '联系电话不能为空' })
    }
    
    // 生成车队编号
    const cheduibianhao = await generateCheduiBianhao()
    
    const [result] = await pool.execute(
      `INSERT INTO cheduiguanli 
       (cheduibianhao, cheduimingcheng, cheduifuzeren, lianxidianhua, 
        chuangjianshijian, beizhu, sfsh, cheduishuliang, chengyuanshuliang) 
       VALUES (?, ?, ?, ?, ?, ?, '待审核', 0, 0)`,
      [cheduibianhao, cheduimingcheng.trim(), cheduifuzeren.trim(), lianxidianhua.trim(), 
       chuangjianshijian || new Date().toISOString().slice(0, 19).replace('T', ' '), beizhu || '']
    )
    
    res.json({
      code: 0,
      msg: '新增成功',
      data: { id: result.insertId, cheduibianhao }
    })
  } catch (error) {
    console.error(error)
    res.json({ code: 500, msg: '新增失败' })
  }
})

// 修改车队
router.post('/update', async (req, res) => {
  try {
    const {
      id,
      cheduimingcheng,
      cheduifuzeren,
      lianxidianhua,
      beizhu
    } = req.body
    
    if (!id) {
      return res.json({ code: 400, msg: '缺少ID' })
    }
    
    // 检查车队是否存在
    const [exist] = await pool.execute(
      'SELECT id FROM cheduiguanli WHERE id = ?',
      [id]
    )
    if (exist.length === 0) {
      return res.json({ code: 404, msg: '车队不存在' })
    }
    
    await pool.execute(
      `UPDATE cheduiguanli SET 
       cheduimingcheng = ?, 
       cheduifuzeren = ?, 
       lianxidianhua = ?, 
       beizhu = ?
       WHERE id = ?`,
      [cheduimingcheng.trim(), cheduifuzeren.trim(), lianxidianhua.trim(), beizhu || '', id]
    )
    
    res.json({ code: 0, msg: '修改成功' })
  } catch (error) {
    console.error(error)
    res.json({ code: 500, msg: '修改失败' })
  }
})

// 删除车队
router.post('/delete', async (req, res) => {
  try {
    const ids = req.body
    
    if (!ids || ids.length === 0) {
      return res.json({ code: 400, msg: '请选择要删除的数据' })
    }
    
    // 检查是否有关联车辆
    for (let id of ids) {
      const [carCheck] = await pool.execute(
        `SELECT COUNT(*) as count FROM cheliangguanli 
         WHERE cheduibianhao = (SELECT cheduibianhao FROM cheduiguanli WHERE id = ?)`,
        [id]
      )
      if (carCheck[0].count > 0) {
        return res.json({ code: 400, msg: '请先清空车队下的车辆' })
      }
    }
    
    const placeholders = ids.map(() => '?').join(',')
    await pool.execute(`DELETE FROM cheduiguanli WHERE id IN (${placeholders})`, ids)
    
    res.json({ code: 0, msg: '删除成功' })
  } catch (error) {
    console.error(error)
    res.json({ code: 500, msg: '删除失败' })
  }
})

//审核车队
router.post('/sh', async (req, res) => {
  try {
    const { id, sfsh, shhf } = req.body
    
    if (!id) {
      return res.json({ code: 400, msg: '缺少ID' })
    }
    if (!sfsh) {
      return res.json({ code: 400, msg: '审核状态不能为空' })
    }
    
    await pool.execute(
      'UPDATE cheduiguanli SET sfsh = ?, shhf = ? WHERE id = ?',
      [sfsh, shhf || '', id]
    )
    
    res.json({ code: 0, msg: '审核成功' })
  } catch (error) {
    console.error(error)
    res.json({ code: 500, msg: '审核失败' })
  }
})

//  统计车队数量
router.get('/count', async (req, res) => {
  try {
    const [totalResult] = await pool.execute('SELECT COUNT(*) as count FROM cheduiguanli')
    const [pendingResult] = await pool.execute(
      "SELECT COUNT(*) as count FROM cheduiguanli WHERE sfsh = '待审核'"
    )
    const [carResult] = await pool.execute('SELECT COUNT(*) as count FROM cheliangguanli')
    const [memberResult] = await pool.execute('SELECT COUNT(*) as count FROM cheduichengyuan')
    
    res.json({
      code: 0,
      data: {
        total: totalResult[0].count,
        pending: pendingResult[0].count,
        carCount: carResult[0].count,
        memberCount: memberResult[0].count
      }
    })
  } catch (error) {
    console.error(error)
    res.json({ code: 500, msg: '统计失败' })
  }
})

// 获取车队下的车辆
router.get('/cars/:cheduibianhao', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM cheliangguanli WHERE cheduibianhao = ?',
      [req.params.cheduibianhao]
    )
    res.json({
      code: 0,
      data: rows
    })
  } catch (error) {
    console.error(error)
    res.json({ code: 500, msg: '查询失败' })
  }
})

// 获取车队下的成员
router.get('/members/:cheduibianhao', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM cheduichengyuan WHERE cheduibianhao = ?',
      [req.params.cheduibianhao]
    )
    res.json({
      code: 0,
      data: rows
    })
  } catch (error) {
    console.error(error)
    res.json({ code: 500, msg: '查询失败' })
  }
})

module.exports = router
