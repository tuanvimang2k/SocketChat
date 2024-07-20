import React, { useEffect, useState, useCallback } from 'react'
import { Avatar, Input, List, Card, Badge, Typography, Row, Col, Divider, Button, Modal, Tooltip } from 'antd'
const { Search } = Input
import {
  SmileOutlined,
  SendOutlined,
  LinkOutlined,
  VideoCameraOutlined,
  PhoneOutlined,
  SearchOutlined,
  DownOutlined,
  BarsOutlined,
  PictureOutlined
} from '@ant-design/icons'
import { useNavigate, useParams } from 'react-router-dom'
import moment from 'moment'

// import avt from '../../assets/img/avt.jpg'

import axios from 'axios'

import io from 'socket.io-client'

const { Meta } = Card

const { Text } = Typography
import './message.css'
function Message() {
  const [isopenModal, setIsopenModal] = useState(false)
  const navigate = useNavigate()
  const isValidUrl = (string) => {
    return string?.startsWith('blob:') || string?.startsWith('http')
  }

  const socket = io(`${import.meta.env.VITE_API_URL_API_SOCKET_URL}`)
  const [listfen, setListfen] = useState()
  const [chatwith, setChatwith] = useState('')
  const [showchat, setShowchat] = useState([])

  const [onlineUsers, setOnlineUsers] = useState([])
  const [content, setContent] = useState('')
  const [status, setStatus] = useState(false)
  const [lisPastFen, setLisPastFen] = useState()
  const [roomId, setRoomId] = useState(null)
  const [isModalImg, setIsModalImg] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [imagePath, setImagePath] = useState('')
  const [hasData, setHasData] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const [block, setBlock] = useState(0)

  const [userName, setUserName] = useState(null)

  const avt =
    'https://hoanghamobile.com/tin-tuc/wp-content/webp-express/webp-images/uploads/2024/05/anh-hacker-ngau-1.jpg.webp'

  const id = localStorage.getItem('_id')
  // const id = '6667c2196c09db4d6206cd74'
  // const id = '11111111'

  const friend = {
    name: chatwith !== '' ? chatwith.name : 'Nan',
    status: status ? 'Online' : 'Offline',
    avt: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ4BNuYjOz1nNysILK4AzuYtMgEH8f0RaOYcaOoA9P5IF4qz3-SNFeDzAH13Z3YW_zivms&usqp=CAU'
  }

  const ChatMessage = ({ message, isSender, time }) => {
    return (
      <Row justify={isSender ? 'end' : 'start'}>
        <Col className={isSender ? 'row-sender' : 'row-receiver'}>
          <div className={`chat-message ${isSender ? 'sender' : 'receiver'}`}>
            {isValidUrl(message) ? (
              <>
                <div
                  className='message-img'
                  style={{ cursor: 'pointer' }}
                  onClick={() => {
                    setIsModalImg(true), setImagePath(message)
                  }}
                >
                  <img src={message} height={50}></img>
                </div>
              </>
            ) : (
              <>
                {message?.length > 10 ? (
                  <>
                    <Tooltip title={message}>
                      <div className='message-content'>
                        {message.slice(0, 4)} ... {message.slice(-4)}
                      </div>
                    </Tooltip>
                  </>
                ) : (
                  <>
                    <div className='message-content'>{message}</div>
                  </>
                )}
              </>
            )}
            <Text type='secondary' className='timestamp'>
              {time ? (
                <span>{moment(time).format('DD-MM-YYYY HH:mm')}</span>
              ) : (
                <span>{moment().format('DD-MM-YYYY HH:mm')}</span>
              )}
            </Text>
          </div>
        </Col>
      </Row>
    )
  }

  const openModal = () => {
    setIsopenModal(true)
  }

  const handleCloseModal = () => {
    setIsopenModal(false)
  }

  const changComponentListChat = () => {
    navigate('/a')
    return
  }

  const handleShowchat = async (roomId, block) => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL_BACKEND_URL}${import.meta.env.VITE_API_URL_API_CHAT_BY_ROOM}`,
        {
          params: {
            roomId: roomId,
            block
          }
        }
      )

      if (response.data.success === false) {
        setHasData(false)

        return
      }

      setShowchat(response.data.data)

      setRoomId(roomId)
      setBlock(block)
    } catch (error) {
      setHasData(false)
      console.error('Lỗi:', error)
    }
  }

  const send = async (e) => {
    e.preventDefault()
    const sender = id

    try {
      if (content !== '') {
        await axios.post(`${import.meta.env.VITE_API_URL_API_SOCKET_URL}/api/send-chat`, {
          roomId,
          sender,
          content
        })
        setContent('')
        socket.emit('send_message', { roomId, sender, content })
      }
    } catch (error) {
      console.log(error)
    }
  }

  const sendMessage = async (data) => {
    if (data) {
      try {
        await axios.post(`${import.meta.env.VITE_API_URL_BACKEND_URL}${import.meta.env.VITE_API_URL_API_SEND_CHAT}`, {
          roomId: data.roomId,
          sender: data.sender,
          content: data.content
        })

        handleShowchat(data.roomId, block)
      } catch (error) {
        console.log(error)
      }
    }
  }

  function debounce(func, delay) {
    let timeoutId
    return function (...args) {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      timeoutId = setTimeout(() => {
        func.apply(this, args)
      }, delay)
    }
  }

  const debouncedSendMessage = useCallback(debounce(sendMessage, 2000), [roomId, block])

  useEffect(() => {
    socket.emit('join_room', roomId)

    const handleMessageReceive = (data) => {
      debouncedSendMessage(data)
    }

    socket.on('receive_message', handleMessageReceive)

    socket.on('status', (data) => {
      setStatusMessage(data.message)
    })

    // Hàm cleanup để xóa listeners sự kiện
    return () => {
      socket.off('receive_message', handleMessageReceive)
    }
  }, [roomId, block, debouncedSendMessage])

  const sendImg = async () => {
    const sender = id
    try {
      if (imagePath !== '') {
        console.log(imagePath)
        await axios.post(`${import.meta.env.VITE_API_URL_BACKEND_URL}${import.meta.env.VITE_API_URL_API_SEND_CHAT}`, {
          roomId,
          sender,
          content: imagePath
        })
        handleCloseModal()
        handleShowchat(roomId, block)
      }
    } catch (error) {
      console.log(error)
    }
  }

  const loadmorechat = async () => {
    if (block > 0) {
      setBlock(block - 1)
    }
  }

  useEffect(() => {
    const memberId = id
    const getRoom = async () => {
      // if(id === import.meta.env.VITE_API_URL_ID_ADMIM)VITE_API_URL_ID_ADMIM

      if (id === import.meta.env.VITE_API_URL_ID_ADMIM) {
        try {
          const response = await axios.get(
            `${import.meta.env.VITE_API_URL_BACKEND_URL}${import.meta.env.VITE_API_URL_API_ALL_ROOM}`
          )

          setListfen(response.data.data)

          setLisPastFen(response.data.data)
        } catch (error) {
          console.error('Lỗi:', error)
        }
      } else {
        try {
          const response = await axios.get(
            `${import.meta.env.VITE_API_URL_BACKEND_URL}${import.meta.env.VITE_API_URL_API_ROOM_BY_USER}`,
            { params: { memberId } }
          )

          setListfen(response.data.data)

          setLisPastFen(response.data.data)
        } catch (error) {
          console.error('Lỗi:', error)
        }
      }
    }

    getRoom()
  }, [(showchat.length = 11)])

  useEffect(() => {
    handleShowchat(roomId, block)
  }, [block])

  useEffect(() => {
    if (searchTerm) {
      setListfen(
        listfen.filter((item) => {
          const otherMember = item.members.find((member) => member._id !== id)
          return otherMember && otherMember.username.toLowerCase().includes(searchTerm.toLowerCase())
        })
      )
    } else {
      setListfen(lisPastFen)
    }
  }, [searchTerm])

  const handleFileChange = (event) => {
    const fileList = event.target.files
    if (fileList.length > 0) {
      const filePath = URL.createObjectURL(fileList[0])
      setImagePath(filePath)
    }
  }

  return (
    <div>
      <div className='container '>
        <div className='d-flex'>
          <div className='col-lg-4 col-12 rounded-3 ' style={{ height: '100%', minHeight: '100vh' }}>
            <div className='d-flex justify-content-between ' style={{ height: '150px', lineHeight: '80px' }}>
              <div className=' chat_search'>
                <h2 style={{ fontFamily: 'monospace' }}> CHATS</h2>
                {/* <i class='fa-solid fa-magnifying-glass'></i> */}
                <div className='search-input-container'>
                  {/* <SearchOutlined className='search-icon' onClick={SearchUser} /> */}
                  <Input
                    style={{ padding: '7px', borderRadius: '20px', lineHeight: '30px', paddingLeft: '15px' }}
                    placeholder='Search'
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  ></Input>
                </div>

                <div className='dowload_inbox'>
                  {' '}
                  <i class='fa-solid fa-download' style={{ fontSize: '12px', marginRight: '4px' }}></i>
                  <h6> Achived</h6>
                  <p></p>
                </div>
              </div>
            </div>

            <div className='d-flex gap-3  align-items-center list-item-inbox'>
              <div className='list-item-inbox'>
                <List
                  itemLayout='horizontal'
                  dataSource={listfen}
                  renderItem={(item) => {
                    const otherMember = item.members.filter((member) => member._id !== id)[0]

                    if (otherMember) {
                      return (
                        <>
                          <List.Item className='item-inbox'>
                            <List.Item.Meta
                              avatar={<Avatar src={avt} />}
                              title={otherMember.username}
                              // description={item.latestMessage ? item.latestMessage.content : ''}
                              description={moment(otherMember.createdAt).format('DD-MM-YYYY HH:mm')}
                              onClick={() => {
                                handleShowchat(item._id, item.totalBlock), setHasData(true)
                              }}
                            />
                          </List.Item>
                        </>
                      )
                    }
                  }}
                />
              </div>
            </div>
          </div>
          <div style={{ minHeight: '100vh' }} className='col-lg-8 col-12 '>
            <Card style={{ width: '100%' }}>
              <Meta
                avatar={
                  <Badge dot color={friend.status == 'Online' ? 'green' : 'red'}>
                    <Avatar src={friend.avt} />
                  </Badge>
                }
                title={userName}
                description={friend.status}
              />

              <div className='icon-bar'>
                <VideoCameraOutlined className='icon' />
                <PhoneOutlined className='icon' />
                <SearchOutlined className='icon' />
                <Divider type='vertical' />

                <DownOutlined className='icon dow_select' />
                <BarsOutlined className='icon nav_bars' onClick={changComponentListChat} />
              </div>
            </Card>

            <div className='chat-container'>
              <Divider orientation='center' onClick={loadmorechat}>
                Load Mores
              </Divider>
              {showchat.map((message, index) => {
                {
                  if (id === message?.senderId) {
                    return (
                      <ChatMessage key={index} message={message?.content} isSender={true} time={message?.updatedAt} />
                    )
                  } else {
                    return (
                      <ChatMessage key={index} message={message?.content} isSender={false} time={message?.updatedAt} />
                    )
                  }
                }
              })}
            </div>
            {hasData && (
              <div className='chat-input-container'>
                <LinkOutlined className='icon' />
                <PictureOutlined className='icon' onClick={openModal} />
                <Input
                  className='chat-input'
                  placeholder='Write a message ...'
                  bordered={false}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                />
                <SmileOutlined className='icon' />
                <Button type='primary' shape='circle' icon={<SendOutlined />} onClick={send} />
              </div>
            )}
          </div>
        </div>
      </div>
      <Modal title={'Select file'} open={isopenModal} onCancel={handleCloseModal} onOk={sendImg}>
        <input onChange={handleFileChange} type='file' id='imageUpload' name='image' accept='image/*' />
      </Modal>
      <Modal open={isModalImg} onCancel={() => setIsModalImg(false)} footer={null} closable={false}>
        <div className='message-img'>
          <img src={imagePath} height={300} alt='message content' />
        </div>
      </Modal>
      <div className=''></div>
    </div>
  )
}

export default Message
