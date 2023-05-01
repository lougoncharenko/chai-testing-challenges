require('dotenv').config()
const app = require('../server.js')
const mongoose = require('mongoose')
const chai = require('chai')
const chaiHttp = require('chai-http')
const assert = chai.assert

const User = require('../models/user.js')
const Message = require('../models/message.js')

chai.config.includeStack = true

const expect = chai.expect
const should = chai.should()
chai.use(chaiHttp)

/**
 * root level hooks
 */
after((done) => {
  // required because https://github.com/Automattic/mongoose/issues/1251#issuecomment-65793092
  mongoose.models = {}
  mongoose.modelSchemas = {}
  mongoose.connection.close()
  done()
})

const SAMPLE_OBJECT_ID = 'aaaaaaaaaaaa' // 12 byte string
const sampleUser = new User({
    username: 'myuser',
    password: 'mypassword',
    _id: SAMPLE_OBJECT_ID
})
const MESSAGE_ID = 'cccccccccccc' // 12 byte string

describe('Message API endpoints', () => {
    beforeEach((done) => {
        const testMessage = new Message({
            title: 'testTitle',
            body: 'testBody',
            author: sampleUser._id,
            _id: MESSAGE_ID
        })
        testMessage.save()
        .then(()=> {
           done()  
        })
    })

    afterEach((done) => {
        Message.deleteMany({title: ['testTitle', 'anotherTitle']})
        .then(() => {
            done()
        })
    })

    it('should load all messages', (done) => {
        chai.request(app)
        .get('/messages')
        .end((err, res) => {
            if (err) { done(err) }
            expect(res).to.have.status(200)
            expect(res.body.messages).to.be.an("array")
            done()
        })
    })

    it('should get one specific message', (done) => {
        chai.request(app)
        .get(`/messages/${MESSAGE_ID}`)
        .end((err, res) => {
            if (err) { done(err) }
            expect(res).to.have.status(200)
            expect(res.body).to.be.an('object')
            expect(res.body.title).to.equal('testTitle')
            expect(res.body.body).to.equal('testBody')
            done()
        })
    })

    it('should post a new message', (done) => {
        chai.request(app)
        .post('/messages')
        .send({title: 'anotherTitle', body: 'another test body', author: sampleUser._id })
        .end((err, res) => {
            if (err) { done(err) }
            expect(res.body.message).to.be.an('object')
            expect(res.body.message).to.have.property('title', 'anotherTitle')

            // check that user is actually inserted into database
            Message.findOne({title: 'anotherTitle'}).then(message => {
                expect(message).to.be.an('object')
                done()
            })
        })
    })

    it('should update a message', (done) => {
        chai.request(app)
        .put(`/messages/${MESSAGE_ID}`)
        .send({title: 'testTitle'})
        .end((err, res) => {
            if (err) { done(err) }
            expect(res.body.message).to.be.an('object')
            expect(res.body.message).to.have.property('title', 'testTitle')

            // check that user is actually inserted into database
            Message.findOne({title: 'testTitle'}).then(message => {
                expect(message).to.be.an('object')
                done()
            })
        })
    })

    it('should delete a message', (done) => {
        chai.request(app)
        .delete(`/messages/${MESSAGE_ID}`)
        .end((err, res) => {
            if (err) { done(err) }
            expect(res.body.message).to.equal('Successfully deleted.')
            expect(res.body._id).to.equal(MESSAGE_ID)

            // check that user is actually deleted from database
            Message.findOne({title: 'testTitle'}).then(message => {
                expect(message).to.equal(null)
                done()
            })
        })
    })
})
