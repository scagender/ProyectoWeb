const Router = require('koa-router')
const { User, Course, Plan } = require('./models')

const router = new Router()

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

router.post('/create-users', async (ctx) => {
  try {
    console.log(ctx.request.body)
    const user = await User.create(ctx.request.body)
    ctx.body = user
    ctx.status = 201
  } catch (error) {
    console.log(error)
    ctx.body = error
    ctx.status = 400
  }
})

// DELETE /users/:id
router.delete('/users/:id', async (ctx) => {
  const userId = ctx.params.id

  try {
    // Buscar y eliminar el usuario por su ID
    const user = await User.findByPk(userId)
    if (!user) {
      ctx.status = 404
      ctx.body = { message: 'Usuario no encontrado' }
    } else {
      await user.destroy()
      ctx.status = 204 // No Content
    }
  } catch (error) {
    console.error(error)
    ctx.status = 500
    ctx.body = { message: 'Error interno del servidor' }
  }
})

router.put('/users/:id', async (ctx) => {
  const userId = ctx.params.id

  try {
    // Obtén los datos de usuario actualizados del cuerpo de la solicitud
    const updatedUserData = ctx.request.body

    // Buscar y actualizar el usuario por su ID
    const user = await User.findByPk(userId)
    if (!user) {
      ctx.status = 404
      ctx.body = { message: 'Usuario no encontrado' }
    } else {
      await user.update(updatedUserData) // Actualiza el usuario con los nuevos datos
      ctx.status = 200 // OK
      ctx.body = user // Devuelve el usuario actualizado
    }
  } catch (error) {
    console.error(error)
    ctx.status = 500
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

router.get('/plans/:userId', async (ctx) => {
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
