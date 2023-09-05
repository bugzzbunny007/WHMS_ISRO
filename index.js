const connectDB = require('./db')
connectDB()


var cors = require('cors')

const express = require('express')
const app = express()


app.use(cors({
    origin: '*'
  }));
app.use(express.json()) // Helps use req variables in app.get



//Available Routes
app.use('/api/auth',require('./routes/auth'))


app.get('/', (req, res) => {
    console.log(req.body)
    res.send('ECom API 1!')
})
const port = 5000
app.set('port', process. env. PORT || port);
app.listen(port, () => {
    console.log(`Server started at http://localhost:`,port)
})

// const server = app.listen(0, () => console.log(`Server started at http://localhost:`,server.address().port))
