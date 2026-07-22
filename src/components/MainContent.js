import '../css/maincontent.css';

import '../css/header.css';

import React from 'react';
import { Link } from 'react-router-dom';


function MainContent() {



    return (


        <>



            <div className='module_container'>
                <Link to='/fiche/001' className='home_fiche001_link'>
                    <button type='button' className='home_fiche001_button'>
                        Aller vers la fiche 001
                    </button>
                </Link>
            </div>





        </>


    );
}


export default MainContent;


