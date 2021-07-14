import { Container, Nav, Row, Col, Form, Card, Button, Alert, Table } from 'react-bootstrap'
import { Link, useLocation } from 'react-router-dom'
import { useState, useEffect } from "react";

import { iconMandatory, iconNext, iconPrev } from './icons.js'
import { API } from './API.js';



function Survey({loading, surveys, currSurvey, setCurrSurveyName, setFlagDirty}) {
    const [surveyCompiled, setSurveyCompiled] = useState(0);
    const [utilizzName, setUtilizzName] = useState('');
    const [error, setError] = useState();


    // surveyCompile must bu updated aftet currSurvey change -> use effect
    // call for initialiazed the answers
    useEffect(() => {
        // the currSurvey is not yet available -> when it was available then this useEffect is already called
        if (!currSurvey)
            return;

        setSurveyCompiled(() => {
            let newSurveyCompiled = { surveyName: currSurvey.surveyName, questions: [] };

            for (let i = 0; i < currSurvey.questions.length; i++) {
                if (currSurvey.questions[i].type === "open") {
                    let answer = { type: "open", id: currSurvey.questions[i].id, mandatory: currSurvey.questions[i].mandatory, answer: '' };
                    newSurveyCompiled.questions.push(answer);
                } else {
                    let answer = { type: "close", id: currSurvey.questions[i].id, min: currSurvey.questions[i].min, max: currSurvey.questions[i].max, answer: [] };

                    // create the structure of the answers
                    for (let j = 0; j < currSurvey.questions[i].answer.length; j++) {
                        answer.answer.push(false); // nothing selected by default
                    }

                    newSurveyCompiled.questions.push(answer);
                }
            }

            return newSurveyCompiled;
        })
    }, [currSurvey]);

    const updateAnswer = (question, value, idCheck) => {
        setSurveyCompiled((oldSurveyCompiled) => {
            let newSurveyCompiled = { surveyName: oldSurveyCompiled.surveyName, questions: [] };

            for (let i = 0; i < oldSurveyCompiled.questions.length; i++) {
                if (question.id === oldSurveyCompiled.questions[i].id && question.type === "open") {
                    let ans = { type: "open", id: question.id, mandatory: question.mandatory, answer: value };
                    newSurveyCompiled.questions.push(ans);
                } else if (question.id === oldSurveyCompiled.questions[i].id && question.type === "close") {
                    let ans = { type: "close", id: question.id, min: question.min, max: question.max, answer: [] };

                    // checkbox copy old answers + update the current
                    if (value === "checkbox") {
                        for (let j = 0; j < oldSurveyCompiled.questions[i].answer.length; j++) {
                            if (j === idCheck) {
                                ans.answer.push(!oldSurveyCompiled.questions[i].answer[j]);
                            } else {
                                ans.answer.push(oldSurveyCompiled.questions[i].answer[j]);
                            }
                        }
                    } else if (value === "radio") {
                        // radio enable the current + disable all the others
                        for (let j = 0; j < oldSurveyCompiled.questions[i].answer.length; j++) {
                            if (j === idCheck) {
                                ans.answer.push(true);
                            } else {
                                ans.answer.push(false);
                            }
                        }
                    }

                    newSurveyCompiled.questions.push(ans);
                } else {
                    newSurveyCompiled.questions.push(oldSurveyCompiled.questions[i]);
                }
            }

            return newSurveyCompiled;
        })
    }

    const submitSurvey = () => {
        if (utilizzName === '') {
            setError('Insert your name to submit the survey');
            return false;
        }
        if (utilizzName.length > 200){
            setError('The length of the utilizzatore must be lower than 200 chars');
            setUtilizzName((oldName) => oldName.substring(0,200));
            return;
        }

        for (let i = 0; i < surveyCompiled.questions.length; i++) {
            // check open+mandatory
            if (surveyCompiled.questions[i].type === "open" && surveyCompiled.questions[i].mandatory === true &&
                surveyCompiled.questions[i].answer === "") {
                setError(`Question ${i + 1} is mandatory, write something`);
                return false;
            }

            // check close+mandatory
            if (surveyCompiled.questions[i].type === "close" && surveyCompiled.questions[i].min === 1) {
                let notCompiled = true;
                for (let j = 0; j < surveyCompiled.questions[i].answer.length && notCompiled; j++) {
                    if (surveyCompiled.questions[i].answer[j] === true)
                        notCompiled = false;
                }
                if (notCompiled) {
                    setError(`Question ${i + 1} is mandatory, choose one or more options`);
                    return false;
                }
            }

            // check close+max ans
            if (surveyCompiled.questions[i].type === "close") {
                let numAns = 0;
                for (let j = 0; j < surveyCompiled.questions[i].answer.length; j++) {
                    if (surveyCompiled.questions[i].answer[j] === true)
                        numAns++;
                }

                if (numAns > surveyCompiled.questions[i].max) {
                    setError(`Question ${i + 1} has a limit of ${surveyCompiled.questions[i].max} choosen answer`);
                    return false;
                }
            }
        }

        const surveyAns = { surveyName: surveyCompiled.surveyName, utilizzatore: utilizzName, questions: surveyCompiled.questions };
        API.addSurveyAnswers(surveyAns)
            .then((response) => {
                setFlagDirty((oldFlag) => !oldFlag); // to get an update list of surveys from the server
                window.location.replace("http://localhost:3000");
            }).catch((response) => {
                setError('error sending survey compiled: ' + response);
            });
    }

    const location = useLocation();
    let currSurveyTmp = currSurvey || location.state.currSurvey;


    return loading ? <Table responsive>
        <tbody>
            <tr className="justify-content-center">
                <td>🕗 Please wait, loading the surveys... 🕗</td>
            </tr>
        </tbody>
    </Table> :
        <Row style={{ height: "100%", width: "100%", padding: 8 }}>
            <Col xs={3} style={{ padding: 0 }} className="d-none d-sm-block">
                <Sidebar surveys={surveys} currSurvey={currSurveyTmp.surveyName} setCurrSurvey={setCurrSurveyName} />
            </Col>
            <Col>
                <Form>
                    <Form.Group>
                        <Form.Label column='lg'>{`${currSurveyTmp.surveyName}`}</Form.Label>
                    </Form.Group>
                    <br></br>
                    <Row className="justify-content-left">
                        <Col xs='auto'>
                            <Form.Label>Your name</Form.Label>
                        </Col>
                        <Col xs={5}>
                            <Form.Control type="text" placeholder="enter your name" onChange={ev => setUtilizzName(ev.target.value)} value={utilizzName}/>
                        </Col>
                        <Col xs='auto'>
                            <Button variant="primary" onClick={submitSurvey}>
                                Submit
                        </Button>
                        </Col>
                    </Row>
                    {error ? <Alert variant='danger' onClose={() => setError(0)} dismissible className="mt-4">{error}</Alert> : false}
                    <br></br>
                    {
                        currSurveyTmp.questions.map((question, index) => <Question question={question} index={index} key={index} updateAnswer={updateAnswer}></Question>)
                    }
                </Form>
            </Col>
        </Row>
}

function SurveyStats({loading, surveys, currSurvey, setCurrSurveyName}) {
    // answers get from the db
    const [answers, setAnswers] = useState([]);
    const [idAnswer, setIdAnswer] = useState(0);
    const [ansLoading, setAnsLoading] = useState(true);
    const [error, setError] = useState();

    const location = useLocation();

    let currSurveyTmp = currSurvey || location.state.currSurvey;


    // at the start and when the survey change we update the answers
    useEffect(() => {
        if (!currSurvey) {
            return;
        }

        const getAns = async (surveyName) => {
            try {
                let _survAns = await API.getSurveyAnswers(surveyName);
                setAnswers(_survAns);
            } catch (err) {
                setAnswers([])
                setError('error fetch from server: ' + err);
            }
        }

        setAnsLoading(true);
        setIdAnswer(0); //maybe the other surveys has more compilation and the previous id doesn't exist for the current survey
        getAns(currSurvey.surveyName).then(() => setAnsLoading(false)).catch(() => setAnsLoading(false));
    }, [currSurvey]);


    const getAnswerById = (id) => {
        for (let i = 0; i < answers[idAnswer].questions.length; i++) {
            if (answers[idAnswer].questions[i].id === id)
                return answers[idAnswer].questions[i];
        }
        return undefined;
    }

    if (ansLoading || loading) {
        return <Table responsive>
            <tbody>
                <tr className="justify-content-center">
                    <td>🕗 Please wait, loading the surveys... 🕗</td>
                </tr>
            </tbody>
        </Table>
    }

    return !error ? <Row style={{ height: "100%", width: "100%", padding: 8 }}>
        <Col xs={3} style={{ padding: 0 }} className="d-none d-sm-block">
            <Sidebar surveys={surveys} currSurvey={currSurveyTmp.surveyName} setCurrSurvey={setCurrSurveyName} />
        </Col>
        {answers.length > 0 ?
            <Col>
                <Form>
                    <Form.Group>
                        <Form.Label column='lg'>{`${currSurveyTmp.surveyName}`}</Form.Label>
                    </Form.Group>
                    <br></br>
                    <Row className="justify-content-right">
                        <Col>
                            <Form.Label>{`Compiled by: ${answers[idAnswer].utilizzatore}`}</Form.Label>
                        </Col>
                        <Col xs='auto'>
                            {idAnswer > 0 ? <Button variant="primary" onClick={() => setIdAnswer((oldId) => oldId - 1)}>{iconPrev}{" prev"}</Button>
                                : <></>}
                            {" "}
                            {idAnswer + 1 < answers.length ? <Button variant="primary" onClick={() => setIdAnswer((oldId) => oldId + 1)}>{iconNext}{" next"}</Button>
                                : <></>}
                        </Col>
                    </Row>
                    <br></br>
                    {
                        currSurveyTmp.questions.map((question, index) => <QuestionStat question={question} index={index} key={index} answer={getAnswerById(question.id)}></QuestionStat>)
                    }
                </Form>
            </Col> : <></>
        }
    </Row> : <Alert variant='danger' onClose={() => setError()} dismissible className="mt-4">{error}</Alert>
}

function Question({ question, index, updateAnswer }) {
    switch (question.type) {
        case "open":
            return <Card body><Form.Group>
                <Row>
                    <Col>
                        <Form.Label className="justify-content-sm-right">{question.question}</Form.Label>
                    </Col>
                    <Col sm='auto'>
                        <Comment mandatory={question.mandatory} maxA={1} />
                    </Col>
                </Row>
                <Row>
                    <Form.Control as='textarea' rows={3} onChange={ev => updateAnswer(question, ev.target.value, -1)}></Form.Control>
                </Row>
            </Form.Group></Card>
        case "close":
            return question.max === 1 ? <Card body><Form.Group>
                <Row className='justify-content-sm-right'>
                    <Col>
                        <Form.Label>{question.question}</Form.Label>
                    </Col>
                    <Col sm='auto'>
                        <Comment mandatory={question.min === 1} maxA={question.max} />
                    </Col>
                </Row>
                <Row>
                    <div key={`group${index}`}>
                        {
                            question.answer.map((ans, id) => {
                                return <Form.Check type='radio' id={id} label={ans} name={`group${index}`} key={id}
                                    onChange={ev => updateAnswer(question, "radio", id)}>
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
                </Row>
                <Row>
                    <div key={`group${index}`}>
                        {
                            question.answer.map((ans, id) => {
                                return <Form.Check type='checkbox' id={id} label={ans} name={`group${index}`} key={id}
                                    onChange={ev => updateAnswer(question, "checkbox", id)}>
                                </Form.Check>
                            })
                        }
                    </div>
                </Row>
            </Form.Group></Card>
        default:
            return <></>;
    }
}

function QuestionStat({ question, index, answer }) {
    if (answer === undefined) {
        // it means that there aren't any info form the server about the answer. We omit the answer (the best practise is to hide all the answers to the specific survey)
        return <></>;
    }

    switch (question.type) {
        case "open":
            return <Card body><Form.Group>
                <Row>
                    <Col>
                        <Form.Label className="justify-content-sm-right">{question.question}</Form.Label>
                    </Col>
                    <Col sm='auto'>
                        <Comment mandatory={question.mandatory} maxA={1} />
                    </Col>
                </Row>
                <Row>
                    <Form.Control as='textarea' rows={3} readOnly placeholder={answer.answer}></Form.Control>
                </Row>
            </Form.Group></Card>
        case "close":
            return question.max === 1 ? <Card body><Form.Group>
                <Row className='justify-content-sm-right'>
                    <Col>
                        <Form.Label>{question.question}</Form.Label>
                    </Col>
                    <Col sm='auto'>
                        <Comment mandatory={question.min === 1} maxA={question.max} />
                    </Col>
                </Row>
                <Row>
                    <div key={`group${index}`}>
                        {
                            question.answer.map((ans, id) => {
                                return <Form.Check type='radio' id={id} label={ans} name={`group${index}`} key={id}
                                    checked={answer.answer[id]} disabled>
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
                </Row>
                <Row>
                    <div key={`group${index}`}>
                        {
                            question.answer.map((ans, id) => {
                                return <Form.Check type='checkbox' id={id} label={ans} name={`group${index}`} key={id}
                                    checked={answer.answer[id]} disabled>
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

function Comment({ mandatory, maxA }) {
    if (mandatory && maxA > 1) {
        return <Form.Text muted>{iconMandatory}Mandatory, max answers:{maxA}</Form.Text>
    }
    else if (mandatory) {
        return <Form.Text muted>{iconMandatory}Mandatory</Form.Text>
    }
    else if (maxA > 1) {
        return <Form.Text muted>Max answers:{maxA}</Form.Text>
    }
    return <></>
}


function Sidebar({ surveys, currSurvey, setCurrSurvey }) {
    return (
        <Nav className="flex-column">
            <Container>
                {surveys.map(
                    (survey, index) => <SidebarItem
                        survey={survey} index={index}
                        selected={survey.surveyName === currSurvey}
                        setCurrSurvey={setCurrSurvey}
                        key={index}>
                    </SidebarItem>)}
            </Container>
        </Nav>
    );
}

function SidebarItem({ survey, selected, setCurrSurvey }) {
    if (selected)
        return (
            <Nav.Link as={Link} to={`/surveys/${survey.surveyName}`} className="text-light bg-success">{survey.surveyName}</Nav.Link>
        );
    else
        return (
            <Nav.Link as={Link} to={`/surveys/${survey.surveyName}`} onClick={() => setCurrSurvey(survey.surveyName)} className="text-dark">{survey.surveyName}</Nav.Link>
        );
}

export { Survey, SurveyStats };