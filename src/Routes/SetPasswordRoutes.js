// import { lazy } from 'react';
// import Loadable from '../components/Loadable/Loadable';

// // dashboard routing
// const SetPass = Loadable(lazy(() => import('../features/Login/SetPasswordForm')));

// const SetPasswordRoutes = () => {
//     return (
//         {
//             path: '/set-password',
//             element: <SetPass/>
//         }
      
//     )
// }


// export default SetPasswordRoutes;

import { lazy, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Loadable from '../components/Loadable/Loadable';

// Lazy load the SetPasswordForm component
const SetPass = Loadable(lazy(() => import('../features/Login/SetPasswordForm')));

const SetPasswordRoutes = () => {
    const location = useLocation();
    const [enEmail, setEnEmail] = useState('');
    const [enToken, setEnToken] = useState('');
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const encodeData = queryParams.get('data');

        if (!encodeData) {
            console.error("No encoded data found in the query parameter.");
            setIsReady(true); 
            return;
        }

        console.log("Encoded Data:", encodeData);

        try {
            const decodeData = atob(encodeData);
            console.log("Decoded Data:", decodeData);

            const decodedParams = new URLSearchParams(decodeData);
            const email = decodedParams.get('email')?.replace(/ /g, '+') || '';
            const token = decodedParams.get('token')?.replace(/ /g, '+') || '';

            setEnEmail(email);
            setEnToken(token);
        } catch (error) {
            console.error("Error decoding data:", error);
        }

        setIsReady(true);
    }, [location.search]);
    console.log("Encoded Data:", enEmail,enToken);
   
    return {
        path: '/set-password',
        element: isReady ? <SetPass email={enEmail} token={enToken} /> : <div>Loading...</div>
    };
};

export default SetPasswordRoutes;
