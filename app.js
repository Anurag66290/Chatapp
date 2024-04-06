const express = require('express');
const http = require('http');
const  Sequelize  = require('sequelize');
const socketIo = require('socket.io');
const bodyParser = require('body-parser');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const fileUpload = require('express-fileupload');
const User = require('./model/User');
const Message = require('./model/Message');
const sequelize = require('./Database');
const Op = Sequelize.Op;
const online_user = require('./model/online_user');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(session({
    secret: 'ABCDEFGH',
    resave: false,
    saveUninitialized: true
}));
app.use(fileUpload({
    useTempFiles: true,
    tempFileDir: '/tmp/'
  }));
  
//mysql sequelizeconnection check
sequelize.sync()
    .then(() => {
        console.log('Database Connected');
    })
    .catch(err => {
        console.error('Error Connected database:', err);
    });


// Socket start
io.on('connection', (socket) => {
    console.log('New user connected');

    socket.on('connect_user', async function (data) {
        try {
            let check_sender = await User.findOne({
                where: {
                    username: data.username
                }
              });
              var success_message = {}
              if(!check_sender){
                success_message = {
                    'success_message': 'No found connected unsuccessfully'
                  }
              }
            var socket_id = socket.id
          let check_user = await online_user.findOne({
            where: {
                sender: data.username
            }
          });
          if (check_user) {

            create_socket_user = await online_user.update({
              is_online: 1,
              socket_id: socket_id,
            }, {
              where: {
                sender: data.username
              }
            }
            );
  
          } else {
  
            create_socket_user = await online_user.create({
                sender: data.username,
              socket_id: socket_id,
              is_online: 1,
  
            })
          };
          success_message = {
            'success_message': 'connected successfully'
          }
        
          socket.emit('connect_user', success_message);
        } catch (error) {

          console.log(error,'=================errrrrr')
          throw (error)
        }
      });


    socket.on('send_message', async function (get_data) {
        try {
  
          let find_user_data = await User.findOne({
            where: {
                username: get_data.sender
            },
            raw: true
          })
          
          if (find_user_data) {
           let create_message = await Message.create({
                sender: get_data.sender,
                receiver: get_data.receiver,
                message: get_data.message,
  
            })
                const receiverData = await online_user.findOne({
                    where: {
                        sender: get_data.receiver
                    },
                    raw: true,
                });
     
            let  success_message = {
                'success_message': 'Send Message',
                "code": 200,
                'getdata': create_message
              }
            io.to(receiverData.socket_id).emit('receive_msg', success_message)
  
              socket.emit("receive_msg", success_message);
            }
        }
        catch (error) {
          console.log(error)
          throw (error)
        }
      });
          
    socket.on('get_typing', async function (data) {
        try {
          
            let message = "";
          
            let get_id = await online_user.findOne({
              where: {
                sender: data.receiver
              }
  
            })
            
            if (data.status == 0) {
              message = "typing off"; 
            } else {
              message = "typing on";
            }
            io.to(get_id.socket_id).emit('typing_listener', message);
            socket.emit('typing_listener', message);
          
        } catch (error) {
          console.log(error, "========error=========");
          throw (error)
        }
  
      });

      socket.on('get_chat', async function (data) {
        try {
            var get_data_chat = await Message.findAll({
                where: {
                [Op.or]: [
                    { sender: data.sender, receiver: data.receiver },
                    { sender: data.receiver, receiver: data.sender }
                ]
                }
            });

        let success_message = {
            'success_message': 'Get chat ',
            'getdata': get_data_chat
        }
        if (get_data_chat) {
            socket.emit('my_chat', success_message);
        }
        } catch (error) {
            throw (error)
        }
       
        
  
      });
      
    socket.on('disconnect', async () => {
        try {
            let userDisconnect = await online_user.update({
                is_online: 0,
            }, {
                where: {
                    socket_id: socket.id
                }
            });

        } catch (error) {
            throw (error)
        }

    });
});

// User registration and authentication
app.post('/register', async (req, res) => {
    const { username, password } = req.body;

    // Validate password criteria
    // Contain at least one lowercase letter.
    // Contain at least one uppercase letter.
    // Contain at least one digit.
    // Contain at least one special character from @$!%*?&.
    // Have a minimum length of 8 characters.
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!regex.test(password)) {
        return res.status(400).json({ message: 'please input the strong password' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        await User.create({
            username,
            password: hashedPassword
        });
        res.status(201).json({ message: 'User registered successfully' });
    } catch (err) {
        // console.log(err)
        res.status(500).json({ message: 'Error registering user' , error:err.message });
    }
});

//user Login
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await User.findOne({ where: { username } });
        if (!user) {
            return res.status(401).json({ message: 'Invalid Username' });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid password' });
        }
    let data = {
        "username" : user.username,
        "createdAt": user.createdAt,
        "updatedAt": user.updatedAt
    }
        res.status(200).json({ message: 'Logged in successfully' , data});
    } catch (err) {
        // console.log(err)
        res.status(500).json({ message: 'Error logging in', error:err.message });
    }
});

server.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});
