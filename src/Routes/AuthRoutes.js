import { lazy } from 'react';
import Loadable from '../components/Loadable/Loadable';
const Login = Loadable(lazy(() => import('../features/Login/Login')));
const ForgotPassword = Loadable(lazy(() => import('../features/Login/ForgotPassword')));


const AuthRoutes = () => {
    return (
        {
            path: '/login',
            element: <Login />,
            children: [
                {
                    path: '/login',
                    element: <Login />
                },
                {
                    path: '/login/forgot-password',
                    element: <ForgotPassword />
                },
            ]
        }
    )
}


export default AuthRoutes;
