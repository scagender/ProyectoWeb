const Router = require('koa-router')
const { User, Plan } = require('./models')
const bcrypt = require('bcrypt')
const fs = require('fs').promises
const path = require('path')
const router = new Router()
const jwt = require('jsonwebtoken')

const verifyToken = async (ctx, next) => {
  const accessTokenHeader = ctx.headers.authorization

  if (!accessTokenHeader || !accessTokenHeader.startsWith('Bearer ')) {
    ctx.status = 401
    ctx.body = 'Access denied: Token missing or invalid format'
    console.log('No hay token o formato inválido')
    return
  }

  const accessToken = accessTokenHeader.split(' ')[1]

  try {
    const user = await jwt.verify(accessToken, process.env.JWT_SECRET)
    ctx.state.user = user
    await next()
  } catch (err) {
    console.error('Token verification error:', err)
    ctx.status = 401
    ctx.body = 'Access denied: Invalid token'
  }
}

const verifyAdminToken = async (ctx, next) => {
  const accessTokenHeader = ctx.headers.authorization

  if (!accessTokenHeader || !accessTokenHeader.startsWith('Bearer ')) {
    ctx.status = 401
    ctx.body = 'Access denied: Token missing or invalid format'
    console.log('No hay token o formato inválido')
    return
  }

  const accessToken = accessTokenHeader.split(' ')[1]

  try {
    const user = await jwt.verify(accessToken, process.env.JWT_SECRET)
    ctx.state.user = user
    console.log(user.role)
    if (user.role === 'admin') {
      // El usuario es un administrador, puedes permitir el acceso a recursos específicos
      await next()
    } else {
      ctx.status = 403 // Forbidden
      ctx.body = 'Access denied: User is not an admin'
    }
  } catch (err) {
    console.error('Token verification error:', err)
    ctx.status = 401
    ctx.body = `Access denied: Invalid token: ${err.message}`
  }
}
// USERS

router.get('/users', verifyAdminToken, async (ctx) => {
  try {
    // Ahora, puedes acceder al usuario y su rol desde ctx.state.user
    const { role } = ctx.state.user

    // Verifica el rol antes de realizar la operación
    if (role === 'admin') {
      const users = await User.findAll()
      ctx.status = 200 // OK
      ctx.body = users
    } else {
      ctx.status = 403 // Forbidden
      ctx.body = 'Access denied: User is not an admin'
    }
  } catch (error) {
    console.error(error)
    ctx.status = 500 // Error interno del servidor
    ctx.body = { message: 'Error interno del servidor' }
  }
})

// LOGIN DE USER  ------->USADO
router.post('/login', async (ctx) => {
  try {
    const { email, password } = ctx.request.body

    if (!email || !password) {
      ctx.status = 400 // Bad Request
      ctx.body = { message: 'Correo electrónico o contraseña faltante' }
      return
    }
    // Utiliza el método findOne de Sequelize para buscar un usuario por email
    const user = await User.findOne({ where: { email } })

    if (user) {
      const checkedPassword = await bcrypt.compare(password, user.password)
      if (checkedPassword) {
        const role = user.email === 'planner@uc.cl' ? 'admin' : 'user'
        const token = jwt.sign({ userId: user.id, email: user.email, role }, process.env.JWT_SECRET, { expiresIn: '5m' })
        ctx.status = 200 // OK
        user.token = token
        user.password = undefined
        const options = {
          expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3),
          httpOnly: true,
          sameSite: 'None' // Set the SameSite attribute to 'None'
        }
        ctx.cookies.set('token', token, options)
        ctx.body = { user, token }
      } else {
        ctx.status = 401 // No autorizado
        ctx.body = { message: 'Contraseña incorrecta' }
      }
    } else {
      ctx.status = 404 // No encontrado
      ctx.body = { message: 'Usuario no encontrado' }
    }
  } catch (error) {
    console.error(error)
    ctx.status = 500 // Error interno del servidor
    ctx.body = { message: 'Error interno del servidor' }
  }
})

router.get('/users/:userEmail', async (ctx) => {
  const { userEmail } = ctx.params

  try {
    // Utiliza el método findOne de Sequelize para buscar un usuario por email
    const user = await User.findOne({
      where: {
        email: userEmail
      }
    })

    if (user) {
      ctx.status = 200 // OK
      ctx.body = user
    } else {
      ctx.status = 404 // No encontrado
      ctx.body = { message: 'Usuario no encontrado' }
    }
  } catch (error) {
    console.error(error)
    ctx.status = 500 // Error interno del servidor
    ctx.body = { message: 'Error interno del servidor' }
  }
})

router.get('/users/:id', async (ctx) => {
  const { id } = ctx.params.id

  try {
    // Buscar y eliminar el usuario por su ID
    const user = await User.findByPk(id)
    if (user) {
      ctx.status = 200 // OK
      ctx.body = user
    } else {
      ctx.status = 404 // No encontrado
      ctx.body = { message: 'Usuario no encontrado' }
    }
  } catch (error) {
    console.error(error)
    ctx.status = 500 // Error interno del servidor
    ctx.body = { message: 'Error interno del servidor' }
  }
})

// CREATE USER USADO
router.post('/create-users', async (ctx) => {
  try {
    const { username, email, password } = ctx.request.body
    const existingUser = await User.findOne({ where: { email } })
    if (existingUser) {
      ctx.status = 409
      ctx.body = { message: 'El email ya está registrado' }
      return
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const user = await User.create({
      username,
      email,
      password: hashedPassword
    })

    // Check if the email is planner@uc.cl
    if (email === 'planner@uc.cl') {
      await createDefaultMallas(user.id)
    }

    const token = jwt.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' })
    user.token = token
    user.password = undefined
    ctx.body = user
    ctx.status = 201
  } catch (error) {
    console.log(error)
    ctx.body = error
    ctx.status = 400
  }
})

// DELETE USER CON EMAIL Y PASSWORD
router.delete('/delete-user', verifyToken, async (ctx) => {
  const { email, password } = ctx.request.body

  try {
    // Check if the authenticated user is the same as the user to be deleted
    if (ctx.state.user.email !== email) {
      ctx.status = 403 // Forbidden
      ctx.body = { message: 'Acción no permitida' }
      return
    }
    // Utiliza el método findOne de Sequelize para buscar un usuario por email
    const user = await User.findOne({
      where: {
        email
      }
    })

    if (!user) {
      ctx.status = 404 // No encontrado
      ctx.body = { message: 'Usuario no encontrado' }
      return
    }

    // Verificar la contraseña proporcionada
    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
      ctx.status = 401 // No autorizado
      ctx.body = { message: 'Contraseña incorrecta' }
      return
    }

    // Eliminar el usuario
    await user.destroy()

    ctx.status = 204 // Sin contenido (éxito, pero no hay respuesta)
  } catch (error) {
    console.error(error)
    ctx.status = 500 // Error interno del servidor
    ctx.body = { message: 'Error interno del servidor' }
  }
})

// UPDATE USER CON EMAIL Y PASSWORD
router.put('/update-user', verifyToken, async (ctx) => {
  const { email, password, updatedUserData } = ctx.request.body
  try {
    // Check if the authenticated user is the same as the user to be updated
    if (ctx.state.user.email !== email) {
      ctx.status = 403 // Forbidden
      ctx.body = { message: 'Acción no permitida' }
      return
    }

    // Use Sequelize's findOne method to find a user by email
    const user = await User.findOne({
      where: {
        email
      }
    })

    if (!user) {
      ctx.status = 404 // Not Found
      ctx.body = { message: 'Usuario no encontrado' }
      return
    }

    // Verify the provided password
    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      ctx.status = 401 // Unauthorized
      ctx.body = { message: 'Contraseña incorrecta' }
      return
    }

    if (updatedUserData && updatedUserData.password) {
      // Hash the new password
      const hashedPassword = await bcrypt.hash(updatedUserData.password, 10)
      // Update the password in the updatedUserData object
      updatedUserData.password = hashedPassword
    }

    await user.update(updatedUserData)
    ctx.status = 200 // OK
    ctx.body = user // Return the updated user
  } catch (error) {
    console.error(error)
    ctx.status = 500 // Internal Server Error
    ctx.body = { message: 'Error interno del servidor' }
  }
})

// PLANS

// POST /plans (Crear un nuevo plan)
router.post('/create-plans', async (ctx) => {
  try {
    const planData = ctx.request.body
    const newPlan = await Plan.create(planData)
    ctx.status = 201 // Creado
    ctx.body = newPlan
  } catch (error) {
    console.error(error)
    ctx.status = 400 // Bad Request
    ctx.body = { message: 'Error al crear el plan' }
  }
})

router.put('/plans/:id', verifyToken, async (ctx) => {
  const planId = ctx.params.id

  try {
    const updatedPlanData = ctx.request.body

    const plan = await Plan.findByPk(planId)
    if (!plan) {
      ctx.status = 404
      ctx.body = { message: 'Plan no encontrado' }
      return
    }

    if (ctx.state.user.userId !== plan.user_id) {
      ctx.status = 403 // Forbidden
      ctx.body = { message: 'Acción no permitida: usted no es el propietario de este plan' }
      return
    }

    await plan.update(updatedPlanData)
    ctx.status = 200 // OK
    ctx.body = plan // Return the updated plan
  } catch (error) {
    console.error(error)
    ctx.status = 500
    ctx.body = { message: 'Error interno del servidor' }
  }
})

// DELETE /plans/:id (Eliminar un plan por su ID)
router.delete('/plans/:id', verifyToken, async (ctx) => {
  const planId = ctx.params.id

  try {
    const plan = await Plan.findByPk(planId)
    if (!plan) {
      ctx.status = 404
      ctx.body = { message: 'Plan no encontrado' }
      return
    }

    // Check if the authenticated user is the same as the user associated with the plan
    if (ctx.state.user.userId !== plan.user_id) {
      ctx.status = 403 // Forbidden
      ctx.body = { message: 'Acción no permitida: usted no es el propietario de este plan' }
      return
    }

    // Delete the plan
    await plan.destroy()
    ctx.status = 204 // No Content
  } catch (error) {
    console.error(error)
    ctx.status = 500
    ctx.body = { message: 'Error interno del servidor' }
  }
})

router.get('/plans', verifyToken, async (ctx) => {
  try {
    console.log('Query', ctx.query)
    const { userId, planId } = ctx.query

    const adminUserId = await User.findOne({ where: { email: 'planner@uc.cl' } }).then(user => user.id)

    console.log('GET /plans')
    console.log('  userId:', userId)
    console.log('  planId:', planId)

    // No se puede pedir user_id y plan_id a la vez
    if (userId && planId) {
      ctx.status = 400 // Bad Request
      ctx.body = { message: 'No se pueden especificar ambos, userId y planId' }
      return
    }
    // get by user_id
    else if (userId) {
      const plansQuery = { where: { user_id: userId } }
      // Allow any user to access plans created by the admin
      if (parseInt(userId, 10) === adminUserId) {
        delete plansQuery.where.user_id // Remove the user_id filter
      } else if (ctx.state.user.userId !== parseInt(userId, 10)) {
        ctx.status = 403
    // get by user_id
    } else if (userId) {
      // Auth
      if (ctx.state.user.userId !== parseInt(userId, 10)) {
        console.log('state user_id:', ctx.state.user.userId)
        console.log('param user:', userId)
        ctx.status = 403 // Forbidden
        ctx.body = { message: 'Acción no permitida: usted no puede ver los planes de este usuario' }
        return
      }

      const userPlans = await Plan.findAll(plansQuery)
      ctx.status = 200
      ctx.body = userPlans
    }
    else if (planId) {
      const parsedPlanId = parseInt(planId, 10)
      if (isNaN(parsedPlanId)) {
        ctx.status = 400 // Bad Request
        ctx.body = { message: 'planId debe ser un número válido' }
        return
      }
      const plan = await Plan.findByPk(parsedPlanId)
      console.log('plan: ', plan)
      if (plan) {
        ctx.status = 200 // OK
        ctx.body = plan
      } else {
        ctx.status = 404 // Not Found
        ctx.body = { message: 'Plan no encontrado' }
      }
      return
    }

    ctx.status = 400 // Bad Request
    ctx.body = { message: 'Debe proporcionar userId o planId' }
  } catch (error) {
    console.error(error)
    ctx.status = 500 // Internal Server Error
    ctx.body = { message: 'Error interno del servidor' }
  }
})

router.get('/all-plans/:planId', async (ctx) => {
  try {
    console.log('GET /all-plans/:planId')

    const { planId } = ctx.params
    console.log('  planId:', planId)

    const parsedPlanId = parseInt(planId, 10)
    if (isNaN(parsedPlanId)) {
      ctx.status = 400 // Bad Request
      ctx.body = { message: 'planId debe ser un número válido' }
      return
    }

    // Obtener el plan por ID
    const plan = await Plan.findByPk(parsedPlanId)

    if (!plan) {
      ctx.status = 404 // Not Found
      ctx.body = { message: 'Plan no encontrado' }
      return
    }


    // Puedes ajustar la respuesta según tus necesidades
    ctx.status = 200 // OK
    ctx.body = plan
  } catch (error) {
    console.error(error)
    ctx.status = 500 // Internal Server Error
    ctx.body = { message: 'Error interno del servidor' }
  }
})

router.get('/all-plans', async (ctx) => {
  try {
    const userId = 1 // Cambia esto al ID del usuario específico que deseas
    const userPlans = await Plan.findAll({
      where: { user_id: userId },
      attributes: ['id', 'name', 'createdAt', 'updatedAt']
    })
    ctx.status = 200 // OK
    ctx.body = userPlans
  } catch (error) {
    console.error(error)
    ctx.status = 500 // Internal Server Error
    ctx.body = { message: 'Error interno del servidor' }
  }
})

async function createDefaultMallas (userId) {
  const mallas = [
    { filename: 'ingenieriaDeSoftware.json', name: 'Ingenieria De Software' },
    { filename: 'ingenieriaIndustrial.json', name: 'Ingenieria Industrial' },
    { filename: 'ingenieriaMecanica.json', name: 'Ingenieria Mecanica' }
  ]

  for (const malla of mallas) {
    try {
      const data = await fs.readFile(path.join(__dirname, malla.filename), 'utf8')
      const courses = JSON.parse(data)
      await Plan.create({
        malla: JSON.stringify(courses),
        user_id: userId,
        name: malla.name
      })
    } catch (error) {
      console.error('Error creando mallas:', error)
    }
  }
}

module.exports = router
