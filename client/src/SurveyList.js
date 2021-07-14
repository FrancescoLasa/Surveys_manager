// import { useHistory, useLocation} from 'react-router-dom';
import { Table } from "react-bootstrap";
import { Link } from "react-router-dom";

import { iconGoSurvey } from './icons.js';


function SurveyListUser({ surveys, setCurrSurvey_byName, loading }) {

    return loading ? <Table responsive>
        <tbody>
            <tr className="justify-content-center">
                <td>🕗 Please wait, loading the surveys... 🕗</td>
            </tr>
        </tbody>
    </Table> :
        <Table responsive>
            <thead>
                <tr>
                    <th>
                        #
                </th>
                    <th style={{ fontWeight: "bold", fontSize: 26, border: "none" }}>
                        Survey name
                </th>
                    <th>
                        Creator
                </th>
                    <th>
                        Compile
                </th>
                </tr>
            </thead>
            <tbody>
                {surveys.map((survey, index) => (
                    <UserRow key={index} numId={index} survey={survey} selectSurvey={setCurrSurvey_byName}></UserRow>
                ))}
            </tbody>
        </Table>
}

function UserRow(props) {
    return <tr>
        <td>
            {`${props.numId}.`}
        </td>
        <td>
            {props.survey.surveyName}
        </td>
        <td>
            {props.survey.author}
        </td>
        <td>
            <Link style={{ textDecoration: 'none', color: 'green' }} to={{
                pathname: `/surveys/${props.survey.surveyName}`, //
                state: {currSurvey:{surveyName:props.survey.surveyName, questions:[]}} // set the current usrvey obj
            }} onClick={() => {
                props.selectSurvey(props.survey.surveyName);
            }}>
                {iconGoSurvey}
            </Link>
        </td>
    </tr>
}




function SurveyListAdmin({ surveys, setCurrSurvey_byName, loading }) {
    return loading ? <Table responsive>
        <tbody>
            <tr className="justify-content-center">
                <td>🕗 Please wait, loading the surveys... 🕗</td>
            </tr>
        </tbody>
    </Table> :
        <Table responsive>
            <thead>
                <tr>
                    <th>
                        #
                </th>
                    <th style={{ fontWeight: "bold", fontSize: 26, border: "none" }}>
                        Survey name
                </th>
                    <th>
                        Creator
                </th>
                    <th>
                        See answer
                </th>
                    <th>
                        #Compile
                </th>
                </tr>
            </thead>
            <tbody>
                {surveys.map((survey, index) => (
                    <AdminRow key={index} numId={index} survey={survey} selectSurvey={setCurrSurvey_byName}></AdminRow>
                ))}
            </tbody>
        </Table>
}

function AdminRow(props) {
    return <tr>
        <td>
            {`${props.numId}.`}
        </td>
        <td>
            {props.survey.surveyName}
        </td>
        <td>
            {props.survey.author}
        </td>
        <td>
            <Link style={{ textDecoration: 'none', color: 'green' }} to={{
                pathname: `/surveys/${props.survey.surveyName}`, //
                state: {currSurvey:{surveyName:props.survey.surveyName, questions:[]}} // set the current usrvey obj
            }} onClick={() => {
                props.selectSurvey(props.survey.surveyName);
            }}>
                {iconGoSurvey}
            </Link>
        </td>
        <td>
            {props.survey.numComp}
        </td>
    </tr>
}


export { SurveyListUser, SurveyListAdmin };