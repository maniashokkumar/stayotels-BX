import { lazy } from 'react';
import { Navigate, useLocation } from "react-router-dom";

import MainLayout from '../features/MainLayout/MainLayout';
import Loadable from '../components/Loadable/Loadable';

// dashboard routing
const ManageUser = Loadable(lazy(() => import('../features/User/ManageUser/ManageUser')));
const CreateUser = Loadable(lazy(() => import('../features/User/CreateUser/CreateUser')));
const ManageLocation = Loadable(lazy(() => import('../features/Location/ManageLocation/ManageLocation')));
const CreateLocation = Loadable(lazy(() => import('../features/Location/CreateLocation/CreateLocation')));
const ManageAmenities = Loadable(lazy(() => import('../features/Amenities/ManageAmenities/ManageAmenities')));
const CreateAmenities = Loadable(lazy(() => import('../features/Amenities/CreateAmenities/CreateAmenities')));
const ManagePrice = Loadable(lazy(() => import('../features/Price/ManagePrice/ManagePrice')));
const CreatePrice = Loadable(lazy(() => import('../features/Price/CreatePrice/CreatePrice')));
const ManageHotel = Loadable(lazy(() => import('../features/Hotel/ManageHotel/ManageHotel')));
const CreateHotel = Loadable(lazy(() => import('../features/Hotel/CreateHotel/CreateHotel')));
const CreateRooms = Loadable(lazy(() => import('../features/Rooms/CreateRooms/CreateRooms')));
const ManageRooms = Loadable(lazy(() => import('../features/Rooms/ManageRooms/ManageRooms')));
const ManageReservation = Loadable(lazy(() => import('../features/Reservation/ManageReservation/ManageReservation')));
const CreateReservation = Loadable(lazy(() => import('../features/Reservation/CreateReservation/CreateReservation')));
const CalendarView = Loadable(lazy(() => import('../features/CalendarView/CalendarView')));


const MainRoutes = (user) => {
    const location = useLocation();
    return (
        {
            path: '/',
            element: user ? <MainLayout /> : <Navigate to="/login" state={{ from: location }} />,
            children: [
                {
                    path: '/',
                    element: <ManageLocation />,
                },
                {
                    path: '/manage-location',
                    element: <ManageLocation />
                },
                {
                    path: '/create-location',
                    element: <CreateLocation />
                },
                {
                    path: '/manage-user',
                    element: <ManageUser />
                },
                {
                    path: '/create-user',
                    element: <CreateUser />
                },
               {
                    path: '/manage-amenities',
                    element: <ManageAmenities />
                },
                {
                    path: '/create-amenities',
                    element: <CreateAmenities />
                },
                
                {
                    path: '/manage-price',
                    element: <ManagePrice />
                },
                {
                    path: '/create-price',
                    element: <CreatePrice />
                },
                {
                    path: '/manage-hotel',
                    element: < ManageHotel/>
                },
                {
                    path: '/create-hotel',
                    element: <CreateHotel />
                },
                {
                    path: '/manage-rooms',
                    element: < ManageRooms/>
                },
                {
                    path: '/create-rooms',
                    element: < CreateRooms/>
                },
                {
                    path: '/manage-reservation',
                    element: < ManageReservation/>
                },
                {
                    path: '/create-reservation',
                    element: < CreateReservation/>
                },
                {
                    path: '/calendar',
                    element: < CalendarView/>
                },
            ]
        }
    )
}


export default MainRoutes;