import { useContext } from "react";
import { Redirect } from 'react-router';

import { SurveyListUser, SurveyListAdmin } from './SurveyList';
import { Ctx } from './Context.js'
import { Survey, SurveyStats } from './Survey.js'



function SurveyContainer({ match }) {
    const [loggedIn, loading, surveys, setCurrSurveyName, currSurvey, currSurveyName, setFlagDirty] = useContext(Ctx);
    
    // detect if we have already selected a survey
    const surveyName = match.params.surveyName || undefined;

    // detect if the surveyName is a valid one
    if (surveyName === undefined || surveys.filter((survey) => { return survey.surveyName === surveyName }).length === 0){
        return <Redirect to='/' />
    }
    
    // if we put directly the url of a valid survey we must update the currSurvey before getting the page
    if(currSurveyName !== surveyName){
        setCurrSurveyName(surveyName);
        return <></>; // it will be an update of state -> rerender
    }

    if(loggedIn){
        return <SurveyStats loading={loading} surveys={surveys} currSurvey={currSurvey} setCurrSurveyName={setCurrSurveyName} setFlagDirty={setFlagDirty}></SurveyStats>
    }else{
        return <Survey loading={loading} surveys={surveys} currSurvey={currSurvey} setCurrSurveyName={setCurrSurveyName} setFlagDirty={setFlagDirty}></Survey>
    }
}

function SurveyContainerList() {
    const [loggedIn, loading, surveys, setCurrSurveyName] = useContext(Ctx);

    

    if (loggedIn) {
        // admin stuff
        return <SurveyListAdmin surveys={surveys} setCurrSurvey_byName={setCurrSurveyName} loading={loading}></SurveyListAdmin>
    } else {
        // utilizzatore stuff
        return <SurveyListUser surveys={surveys} setCurrSurvey_byName={setCurrSurveyName} loading={loading}></SurveyListUser> 
    }
}


export { SurveyContainerList, SurveyContainer };