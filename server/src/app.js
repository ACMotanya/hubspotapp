
const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const morgan = require('morgan')
const {sequelize} = require('./models')

const app = express()
app.use(morgan('combined'))
app.use(bodyParser.json())
app.use(cors())

app.post('/register', (req, res) => {
  res.send({
    message: `user is valid ${req.body.email}!`
  })
})

sequelize.sync()
	.then(() => {
		
	})
app.listen(process.env.PORT || 8081)
