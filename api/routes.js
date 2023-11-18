const Router = require('koa-router')
const { User, Course, Plan } = require('./models')
const bcrypt = require('bcrypt')

const router = new Router()
const jwt = require('jsonwebtoken')

const verifyToken = async (ctx, next) => {
  const accessTokenHeader = ctx.headers['authorization']

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

router.get('/plans/:userId', verifyToken, async (ctx) => {
  try {
    const { userId } = ctx.params
    const userPlans = await Plan.findAll({ where: { user_id: userId } })
    ctx.status = 200 // OK
    ctx.body = userPlans
  } catch (error) {
    console.error('Error retrieving user plans:', error)
    ctx.status = 500 // Internal Server Error
    ctx.body = { message: 'Internal Server Error' }
  }
})

// USERS

router.get('/users', async (ctx) => {
  try {
    const users = await User.findAll()
    ctx.status = 200 // OK
    ctx.body = users
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
    const user = await User.findOne({ where: { email: email } })

    if (user) {
      const checkedPassword = await bcrypt.compare(password, user.password)
      if (checkedPassword) {
        const token = jwt.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '5m' })
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

// GET USER CON EMAIL (TODO: YA NI ME ACUERDO SI SE USA, SI VEN QUE NO BORRENLO NOMAS)
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

// TODO: NO FUNCIONA
router.get('/users/:id', async (ctx) => {
  const { id } = ctx.params

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
    // Verificar si el usuario ya está registrado
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
router.delete('/delete-user', async (ctx) => {
  const { email, password } = ctx.request.body

  try {
    // Utiliza el método findOne de Sequelize para buscar un usuario por email
    const user = await User.findOne({
      where: {
        email: email
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
router.put('/update-user', async (ctx) => {
  const { email, password, updatedUserData } = ctx.request.body
  try {
    // Utiliza el método findOne de Sequelize para buscar un usuario por email
    const user = await User.findOne({
      where: {
        email: email
      }
    })
    if (!user) {
      ctx.status = 404
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
    if (updatedUserData && updatedUserData.password) {
      // Hash de la nueva contraseña
      const hashedPassword = await bcrypt.hash(updatedUserData.password, 10)
      // Actualizar la contraseña en el objeto updatedUserData
      updatedUserData.password = hashedPassword
    }
    await user.update(updatedUserData)
    ctx.status = 200 // OK
    ctx.body = user // Devuelve el usuario actualizado
  } catch (error) {
    console.error(error)
    ctx.status = 500 // Error interno del servidor
    ctx.body = { message: 'Error interno del servidor' }
  }
})

// COURSES

router.get('/courses', async (ctx) => {
  const courses = await Course.findAll({
    attributes: ['id', 'code', 'credits'],
    include: [{
      model: User, // Make sure you have imported the User model at the top of your file
      attributes: ['id'] // Adjust the attributes as needed
    }]
  })
  ctx.body = courses
})

// POST /courses (Crear un nuevo curso)
router.post('/create-courses', async (ctx) => {
  try {
    const courseData = ctx.request.body
    const newCourse = await Course.create(courseData)
    ctx.status = 201 // Creado
    ctx.body = newCourse
  } catch (error) {
    console.error(error)
    ctx.status = 400 // Bad Request
    ctx.body = { message: 'Error al crear el curso' }
  }
})

// DELETE /courses/:id (Eliminar un curso por su ID)
router.delete('/courses/:id', async (ctx) => {
  const courseId = ctx.params.id

  try {
    const course = await Course.findByPk(courseId)
    if (!course) {
      ctx.status = 404 // No Encontrado
      ctx.body = { message: 'Curso no encontrado' }
    } else {
      await course.destroy()
      ctx.status = 204 // Sin Contenido
    }
  } catch (error) {
    console.error(error)
    ctx.status = 500 // Error Interno del Servidor
    ctx.body = { message: 'Error al eliminar el curso' }
  }
})

// PUT /courses/:id
router.put('/courses/:id', async (ctx) => {
  const courseId = ctx.params.id

  try {
    // Obtén los datos de curso actualizados del cuerpo de la solicitud
    const updatedCourseData = ctx.request.body

    // Buscar y actualizar el curso por su ID
    const course = await Course.findByPk(courseId)
    if (!course) {
      ctx.status = 404
      ctx.body = { message: 'Curso no encontrado' }
    } else {
      // Actualiza el campo 'credits' con el nuevo valor
      course.credits = updatedCourseData.credits
      // Guarda los cambios en la base de datos
      await course.save()

      ctx.status = 200 // OK
      ctx.body = course // Devuelve el curso actualizado
    }
  } catch (error) {
    console.error(error)
    ctx.status = 500
    ctx.body = { message: 'Error interno del servidor' }
  }
})

// PLANS

router.get('/plans', async (ctx) => {
  try {
    const plans = await Plan.findAll()
    ctx.status = 200 // OK
    ctx.body = plans
  } catch (error) {
    console.error(error)
    ctx.status = 500 // Error interno del servidor
    ctx.body = { message: 'Error interno del servidor' }
  }
})

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

router.put('/plans/:id', async (ctx) => {
  const planId = ctx.params.id

  try {
    // Obtén los datos de plan actualizados del cuerpo de la solicitud
    const updatedPlanData = ctx.request.body

    // Buscar y actualizar el plan por su ID
    const plan = await Plan.findByPk(planId)
    if (!plan) {
      ctx.status = 404
      ctx.body = { message: 'Plan no encontrado' }
    } else {
      await plan.update(updatedPlanData) // Actualiza el plan con los nuevos datos
      ctx.status = 200 // OK
      ctx.body = plan // Devuelve el plan actualizado
    }
  } catch (error) {
    console.error(error)
    ctx.status = 500
    ctx.body = { message: 'Error interno del servidor' }
  }
})

// DELETE /plans/:id (Eliminar un plan por su ID)
router.delete('/plans/:id', async (ctx) => {
  const planId = ctx.params.id

  try {
    const plan = await Plan.findByPk(planId)
    if (!plan) {
      ctx.status = 404
      ctx.body = { message: 'Plan no encontrado' }
    } else {
      await plan.destroy()
      ctx.status = 204 // Sin Contenido
    }
  } catch (error) {
    console.error(error)
    ctx.status = 500
    ctx.body = { message: 'Error interno del servidor' }
  }
})

router.get('/plans/:userId', verifyToken, async (ctx) => {
  try {
    const { userId } = ctx.params
    const userPlans = await Plan.findAll({ where: { user_id: userId } })
    ctx.status = 200 // OK
    ctx.body = userPlans
  } catch (error) {
    console.error(error)
    ctx.status = 500 // Error interno del servidor
    ctx.body = { message: 'Error interno del servidor' }
  }
})

router.get('/plans/:planId/courses', async (ctx) => {
  try {
    const { planId } = ctx.params
    const plan = await Plan.findByPk(planId, {
      include: Course
    })

    if (plan) {
      ctx.status = 200 // OK
      ctx.body = plan.Courses
    } else {
      ctx.status = 404 // No encontrado
      ctx.body = { message: 'Plan no encontrado' }
    }
  } catch (error) {
    console.error(error)
    ctx.status = 500 // Error interno del servidor
    ctx.body = { message: 'Error interno del servidor' }
  }
})

module.exports = router
