import { Container, Button, Row, Col, Form, Modal, Alert, Card } from 'react-bootstrap'
import { useState } from "react";


import { iconMandatory, iconMoveUp, iconMoveDown, iconDelete } from './icons.js'
import { API } from './API.js'



function SurveyCreate({ setFlagDirty }) {
    const [workingSurvey, setWorkingSurvey] = useState();
    const [surveyName, setSurveyName] = useState('');
    const [addingQuestion, setAddingQuestion] = useState(false);
    const [errorSend, setErrorSend] = useState('');
    const [error, setError] = useState('');


    if (!workingSurvey)
        setWorkingSurvey(() => {
            const s = { surveyName: "", questions: [] };
            return s;
        });

    const getNextQuestionId = (workingSurvey) => {
        let id = -1;
        for (let i = 0; i < workingSurvey.questions.length; i++) {
            if (workingSurvey.questions[i].id > id)
                id = workingSurvey.questions[i].id;
        }
        return id + 1;
    }

    const moveUpQuestion = (question) => {
        setWorkingSurvey(oldSurvey => {
            let newSurvey = { surveyName: oldSurvey.surveyName, questions: [] };

            let prevQuestion = -1;
            let found = false;
            for (let i = 1; i < oldSurvey.questions.length; i++) {
                prevQuestion = oldSurvey.questions[i - 1].id;
                if (oldSurvey.questions[i].id === question.id) {
                    found = true;
                    break;
                }
            }
            if (!found)
                return oldSurvey; // we are trying to move up the first question -> no sense

            for (let i = 0; i < oldSurvey.questions.length;) {
                if (oldSurvey.questions[i].id === prevQuestion) {
                    newSurvey.questions.push(oldSurvey.questions[i + 1]);
                    newSurvey.questions.push(oldSurvey.questions[i]);
                    i += 2;
                } else {
                    newSurvey.questions.push(oldSurvey.questions[i]);
                    i++;
                }
            }

            return newSurvey;
        });
    }

    const moveDownQuestion = (question) => {
        console.log(question)
        console.log(workingSurvey)
        setWorkingSurvey(oldSurvey => {
            let newSurvey = { surveyName: oldSurvey.surveyName, questions: [] };

            let nextQuestion = oldSurvey.questions.length;
            let found = false;
            for (let i = 0; i < oldSurvey.questions.length - 1; i++) {
                nextQuestion = oldSurvey.questions[i + 1].id;
                if (oldSurvey.questions[i].id === question.id) {
                    found = true;
                    break;
                }
            }
            console.log(nextQuestion)
            if (!found)
                return oldSurvey; // we are trying to move up the first question -> no sense

            for (let i = 0; i < oldSurvey.questions.length;) {
                if (oldSurvey.questions[i].id === question.id) {
                    newSurvey.questions.push(oldSurvey.questions[i + 1]);
                    newSurvey.questions.push(oldSurvey.questions[i]);
                    i += 2;
                } else {
                    newSurvey.questions.push(oldSurvey.questions[i]);
                    i++;
                }
            }

            console.log(newSurvey)
            return newSurvey;
        });
    }

    const deleteSurvey = () => {
        setWorkingSurvey(() => {
            const s = { surveyName: "", questions: [] };
            return s;
        });
        setSurveyName("");
    }

    const deleteQuestion = (question) => {
        setWorkingSurvey((oldSurvey) => {
            let newSurvey = { surveyName: oldSurvey.surveyName, questions: [] };

            for (let i = 0; i < oldSurvey.questions.length; i++) {
                if (oldSurvey.questions[i].id === question.id)
                    continue;
                newSurvey.questions.push(oldSurvey.questions[i]);
            }

            return newSurvey;
        })
    }

    const sendSurvey = () => {
        if (surveyName === '') {
            setError('Insert a survey name');
            return;
        }
        if (surveyName.length > 200){
            setError('The length of the survey name must be lower than 200 chars');
            setSurveyName((oldName) => oldName.substring(0,200));
            return;
        }
        if (workingSurvey.questions.length === 0) {
            setError('The survey must contain at least one question');
            return;
        }

        let _workingSurvery = { surveyName: surveyName, questions: workingSurvey.questions };

        API.addSurvey(_workingSurvery)
            .then((response) => {
                setFlagDirty((oldFlag) => !oldFlag); // to get an update list of surveys from the server
                window.location.replace("http://localhost:3000");
            }).catch((response) => {
                setError('error sending survey: ' + response);
            });
    }


    if (errorSend) {
        return <Alert variant='danger' onClose={() => setErrorSend(0)} dismissible className="mt-4">{errorSend}</Alert>
    }

    return addingQuestion ?
        <FormAddQuestion setWorkingSurvey={setWorkingSurvey} setAddingQuestion={setAddingQuestion} id={getNextQuestionId(workingSurvey)} /> :
        <>
            <Container style={{ height: "100%", width: "100%", padding: 4 }}>
                <Col>
                    <Form>
                        <Form.Group>
                            <Form.Row>
                                <Col xs={3}>
                                    <Form.Label column='lg'>{"Survey title: "}</Form.Label>
                                </Col>
                                <Col>
                                    <Form.Control type='text' size='lg' onChange={ev => setSurveyName(ev.target.value)} placeholder='write title here' value={surveyName}></Form.Control>
                                </Col>
                                <Col xs='auto'>
                                    {<Button onClick={sendSurvey} varian='primary'>Save</Button>}
                                </Col>
                                <Col xs='auto'>
                                    <Button variant='danger' onClick={deleteSurvey}>{"Delete "}{iconDelete}</Button>
                                </Col>
                            </Form.Row>
                            <Form.Row>
                                <Col>
                                    {error ? <Alert variant='danger' onClose={() => setError(0)} dismissible className="mt-4">{error}</Alert> : false}
                                </Col>
                            </Form.Row>
                        </Form.Group>
                        <br></br>
                        {
                            workingSurvey ?
                                workingSurvey.questions.map((question, index) => <Question
                                    question={question} index={index} key={index} moveUpQuestion={moveUpQuestion} moveDownQuestion={moveDownQuestion} deleteQuestion={deleteQuestion}>
                                </Question>) :
                                <></>
                        }
                    </Form>
                </Col>
                <Button onClick={() => setAddingQuestion(true)} variant="success rounded-circle" className="pt-1" style={{ position: "fixed", bottom: "45px", right: "24px" }}><b>+</b></Button>
            </Container>
        </>
}

function Question({ question, index, moveUpQuestion, moveDownQuestion, deleteQuestion }) {
    switch (question.type) {
        case "open":
            return <Card body>
                <Form.Group>
                    <Row>
                        <Col>
                            <Form.Label className="justify-content-sm-right">{question.question}</Form.Label>
                        </Col>
                        <Col sm='auto'>
                            <Comment mandatory={question.mandatory} maxA={1} />
                        </Col>
                        <Col sm='auto' onClick={() => moveUpQuestion(question)}>
                            {iconMoveUp}
                        </Col>
                        <Col sm='auto' onClick={() => moveDownQuestion(question)}>
                            {iconMoveDown}
                        </Col>
                        <Col sm='auto' onClick={() => deleteQuestion(question)}>
                            {iconDelete}
                        </Col>
                    </Row>
                    <Row>
                        <Form.Control as='textarea' rows={3}></Form.Control>
                    </Row>
                </Form.Group>
            </Card>
        case "close":
            return question.max === 1 ?
                <Card body><Form.Group>
                    <Row className='justify-content-sm-right'>
                        <Col>
                            <Form.Label>{question.question}</Form.Label>
                        </Col>
                        <Col sm='auto'>
                            <Comment mandatory={question.min === 1} maxA={question.max} />
                        </Col>
                        <Col sm='auto' onClick={() => moveUpQuestion(question)}>
                            {iconMoveUp}
                        </Col>
                        <Col sm='auto' onClick={() => moveDownQuestion(question)}>
                            {iconMoveDown}
                        </Col>
                        <Col sm='auto' onClick={() => deleteQuestion(question)}>
                            {iconDelete}
                        </Col>
                    </Row>
                    <Row>
                        <div key={`group${index}`}>
                            {
                                question.answer.map((ans, id) => {
                                    return <Form.Check type='radio' key={id} id={id} label={ans} name={`group${index}`}>
                                    </Form.Check>
                                })
                            }
                        </div>
                    </Row>
                </Form.Group></Card> : <Card body><Form.Group>
                    <Row className='justify-content-sm-right'>
                        <Col>
                            <Form.Label>{question.question}</Form.Label>
                        </Col>
                        <Col sm='auto'>
                            <Comment mandatory={question.min === 1} maxA={question.max} />
                        </Col>
                        <Col sm='auto' onClick={() => moveUpQuestion(question)}>
                            {iconMoveUp}
                        </Col>
                        <Col sm='auto' onClick={() => moveDownQuestion(question)}>
                            {iconMoveDown}
                        </Col>
                        <Col sm='auto' onClick={() => deleteQuestion(question)}>
                            {iconDelete}
                        </Col>
                    </Row>
                    <Row>
                        <div key={`group${index}`}>
                            {
                                question.answer.map((ans, id) => {
                                    return <Form.Check type='checkbox' id={id} label={ans} key={id} name={`group${index}`}>
                                    </Form.Check>
                                })
                            }
                        </div>
                    </Row>
                </Form.Group></Card>
        default:
            return <></>
    }
}


function FormAddQuestion({ setWorkingSurvey, setAddingQuestion, id }) {
    const [typeQuestion, setTypeQuestion] = useState("Open question");
    const [error, setError] = useState();
    const [question, setQuestion] = useState('');
    const [numAnswer, setNumAnswer] = useState(1);
    const [answer, setAnswer] = useState(['Write an option']);
    const [maxAnswer, setMaxAnswer] = useState(1);
    const [mandatory, setMandatory] = useState(false);

    const addQuestion = (event) => {
        event.preventDefault();

        if (question === "") {
            setError("The question cannot be empty");
            return;
        }

        switch (typeQuestion) {
            case "Open question":
                setWorkingSurvey(oldSurvey => {
                    let newSurvey = oldSurvey;
                    let q = { question: question, type: "open", mandatory: mandatory, id: id };
                    newSurvey.questions.push(q);
                    return newSurvey;
                })
                break;

            case "Close question":
                for (let i = 0; i < numAnswer; i++) {
                    if (answer[i] === "") {
                        setError("There is at least one empty option");
                        return;
                    }
                }
                setWorkingSurvey(oldSurvey => {
                    let newSurvey = oldSurvey;
                    let q = { question: question, type: "close", min: mandatory ? 1 : 0, max: parseInt(maxAnswer), answer: [], id: id };
                    for (let i = 0; i < numAnswer; i++)
                        q.answer.push(answer[i]);
                    newSurvey.questions.push(q);
                    return newSurvey;
                })
                break;

            default:
                setError("Type of answer unknown");
                return;
        }

        // we add a question with success
        setAddingQuestion(false);
    }

    return <Modal show onHide={() => setAddingQuestion(false)}>
        <Modal.Header>
            <Modal.Title>Add question</Modal.Title>
        </Modal.Header>
        <Form>
            <Modal.Body>
                <Form.Group>
                    <Form.Label>{"Type of answer"}</Form.Label>
                    <Form.Control as="select" onChange={ev => setTypeQuestion(ev.target.value)}>
                        <option>{"Open question"}</option>
                        <option>{"Close question"}</option>
                    </Form.Control>
                </Form.Group>
                <br></br>
                <Form.Group>
                    <Form.Label>Question:</Form.Label>
                    <Form.Control as='textarea' rows={1} placeholder='write here' onChange={ev => setQuestion(ev.target.value)} />
                </Form.Group>
                {typeQuestion === "Close question" ?
                    <>
                        <Form.Group>
                            <Form.Label column='sm'>{`Number of answer: ${numAnswer}`}</Form.Label>
                            <Form.Control type="range" min={1} max={10} value={numAnswer} onChange={ev => {
                                setAnswer(oldAnswer => {
                                    if (ev.target.value >= numAnswer) {
                                        // mantengo le precedenti opzioni
                                        let res = [...oldAnswer];
                                        for (let i = 0; i < ev.target.value - numAnswer; i++)
                                            res.push('write here option');
                                        return res;
                                    } else {
                                        let res = [];
                                        for (let i = 0; i < ev.target.value; i++)
                                            res.push(oldAnswer[i]);
                                        return res;
                                    }
                                });
                                setNumAnswer(ev.target.value);
                            }} />
                        </Form.Group>
                        <Form.Group>
                            <Form.Label column='sm'>{`Max number of answer: ${maxAnswer}`}</Form.Label>
                            <Form.Control type='range' min={1} max={10} value={maxAnswer} onChange={ev => {
                                // no sense se posso selezionare come max più domande di quelle che ci sono
                                if (ev.target.value <= numAnswer)
                                    setMaxAnswer(ev.target.value)
                            }} />
                        </Form.Group>
                        {answer.map((ans, index) => {
                            return <Form.Control placeholder={ans} id={index} key={index} as='textarea' rows={1} size='sm'
                                onChange={ev => {
                                    setAnswer(oldAnswer => {
                                        let res = [];
                                        for (let i = 0; i < numAnswer; i++) {
                                            // || because when there is only a option the map doesn't work so good -> id === '' instead of 0
                                            if (parseInt(ev.target.id) === i || (ev.target.id === '' && i === 0))
                                                res.push(ev.target.value);
                                            else
                                                res.push(oldAnswer[i]);
                                        }
                                        return res;
                                    })
                                }} /> 
                        })}
                        <br></br>
                        <Form.Group >
                            <Form.Check type='checkbox' id={0}>
                                <Form.Check.Input onChange={ev => setMandatory(old => !old)}></Form.Check.Input>
                                <Form.Check.Label>Mandatory</Form.Check.Label>
                            </Form.Check>
                        </Form.Group>
                    </> : <Form.Group >
                        <Form.Check type='checkbox' id={0}>
                            <Form.Check.Input onChange={ev => setMandatory(old => !old)}></Form.Check.Input>
                            <Form.Check.Label>Mandatory</Form.Check.Label>
                        </Form.Check>
                    </Form.Group>}

                {error ? <Alert variant='danger' onClose={() => setError(0)} dismissible className="mt-4">{error}</Alert> : false}
            </Modal.Body>
            <Modal.Footer>
                <Button type="submit" onClick={addQuestion} variant='success'>Add</Button>
                {" " /*separare i pulsanti senza fare styling*/}
                <Button onClick={() => setAddingQuestion(false)} variant='secondary'>Cancel</Button>
            </Modal.Footer>
        </Form>
    </Modal>
}


function Comment({ mandatory, maxA }) {
    if (mandatory && maxA > 1) {
        return <Form.Text muted>{iconMandatory}Mandatory, max answer:{maxA}</Form.Text>
    }
    else if (mandatory) {
        return <Form.Text muted>{iconMandatory}Mandatory</Form.Text>
    }
    else if (maxA > 1) {
        return <Form.Text muted>Max answer:{maxA}</Form.Text>
    }
    return <></>
}




export { SurveyCreate, FormAddQuestion };