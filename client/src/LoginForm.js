import { Form, Button, Alert, Row, Col } from 'react-bootstrap'
import { useState} from "react";



function LoginForm({doLogIn}){
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const login = () => {
        const credentials = { username:email, password:password };

      if(email === ''){
        setError('Username cannot be empty!');
        return;
      }
      if(password === ''){
        setError('Password cannot be empty!');
        return;
      }  
      if(password.length < 6){
        setError('Minimum length for the password is 6 characters!');
        return;
      }
      const validateEmail = (email) => {
        const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(email);
      }
      if(validateEmail(email) === false){
        setError('Enter a valid email!');
        return;
      }

      doLogIn(credentials);
    }


    return  <><Row style={{ height: "100%", width: "100%", padding: 8 }} className="justify-content-center">
        <Col xs={3}></Col>
        <Col>
     <Form>
    <Form.Group controlId="formBasicEmail">
      <Form.Label>Email address</Form.Label>
      <Form.Control type="email" value={email} placeholder="Enter email" onChange={ev => setEmail(ev.target.value)}/>
      <Form.Text className="text-muted">
        We'll never share your email with anyone else.
      </Form.Text>
    </Form.Group>
  
    <Form.Group controlId="formBasicPassword">
      <Form.Label>Password</Form.Label>
      <Form.Control type="password" value={password} placeholder="Password" onChange={ev => setPassword(ev.target.value)}/>
    </Form.Group>

    <Button variant="primary" onClick={login}>{"Login"}</Button>
    </Form>
    </Col>
    <Col xs={3}></Col>
    </Row>
    <Row style={{ height: "100%", width: "100%", padding: 8 }} className="justify-content-center">
        <Col xs={3}></Col>
        <Col> {error ? <Alert variant='danger' dismissible className="mt-4" onClose={() => setError(0)}>{error}</Alert> : ''}</Col>
        <Col xs={3}></Col>
    </Row></>
}

export {LoginForm};