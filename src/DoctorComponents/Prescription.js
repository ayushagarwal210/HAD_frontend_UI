import React, { useState, useEffect } from 'react'
import Dropdown from 'react-bootstrap/Dropdown';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSquareMinus, faSquarePlus, faArrowsRotate } from '@fortawesome/free-solid-svg-icons';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import PatientMedicalHistory from './PatientMedicalHistory';
import GradientLogo from "./GradientLogo.png"

const Prescription = () => {

    const navigate = useNavigate()
    const patientId = localStorage.getItem("DrPatientId");
    const doctorDetails = JSON.parse(localStorage.getItem("doctorDetails"))
    const [observation, setObservation] = useState("")
    const [advice, setAdvice] = useState("")
    const [allMedicineData, setAllMedicineData] = useState([]);
    const [isDatePickerVisible, setIsDatePickerVisible] = useState(false);
    const [showHistory, setShowHistory] = useState(false)
    const [selectedDate, setSelectedDate] = useState(null)
    const [isRotating, setIsRotating] = useState(false)
    const [ptHistory, setPtHistory] = useState(false)
    const [fileList, setFileList] = useState([])
    const [patientDetail, setPatientDetail] = useState([
        {
            patientId: 1,
            firstName: "",
            lastName: "",
            dob: "",
        },
    ]);

    const [inputFeilds, setInputFeilds] = useState([
        { medicine: "", dosage: "" },
    ]);

    const medicineString = inputFeilds
        .map((item) => {
            return `${item.medicine}-->${item.dosage}`;
        })

    function timeout(delay) {
        return new Promise(res => setTimeout(res, delay))
    }
    const handleClick = async () => {
        setIsRotating(true)
        await fetchPtHistory()
        await timeout(1000)
        handleAnimationEnd()
    }

    const handleAnimationEnd = () => {
        setIsRotating(false)
    }

    const getAllMedicine = async () => {
        await axios
            .get("https://rxnav.nlm.nih.gov/REST/displaynames.json")
            .then((response) => {
                setAllMedicineData(response.data.displayTermsList.term);
            })
            .catch((error) => {
                console.log(error);
            });
    };

    const fetchPatientDetail = async () => {
        const jwtToken=localStorage.getItem("jwtToken");
        axios.defaults.headers.common["Authorization"]=`Bearer ${jwtToken}`
        await axios
            .get(`http://localhost:9090/patient/getPatientById/${patientId}`)
            .then((response) => {
                console.log("patientDetail", response.data);
                setPatientDetail(response.data);
                console.log("patients", patientDetail);
            })
            .catch((error) => {
                console.log("error:", error);
            });
    };

    const handleFormChange = (index, event) => {
        let data = [...inputFeilds];
        data[index][event.target.name] = event.target.value;
        setInputFeilds(data);
    };

    const addFields = (event) => {
        event.preventDefault();
        let newfield = { medicine: "", dosage: "" };
        setInputFeilds([...inputFeilds, newfield]);
    };

    const removeFields = (index) => {
        let data = [...inputFeilds];
        data.splice(index, 1);
        setInputFeilds(data);
    };

    const handleToggle = () => {
        setIsDatePickerVisible(!isDatePickerVisible)
    };

    const handleHistory = () => {
        setShowHistory(!showHistory)
    }

    const calculateAge = (dateOfBirth) => {
        const dob = new Date(dateOfBirth);
        const today = new Date();
        let age = today.getFullYear() - dob.getFullYear();
        return age;
    }

    const ptAge = calculateAge(patientDetail.dob)

    // console.log("input",inputFeilds)
    // console.log("medicinestring",medicineString)
    // console.log("follow",selectedDate)
    const submitHandler = async (event) => {
        event.preventDefault();
        const data = {
            consultationDate: new Date(),
            observation: observation,
            medicine: medicineString,
            remark: advice,
            doctorId: doctorDetails.doctorId,
            patientName: patientDetail.firstName,
            patientId: patientId,
            followUpDate: selectedDate,
        };

        // console.log("form updated data", data);
        const jwtToken=localStorage.getItem("jwtToken");
        axios.defaults.headers.common["Authorization"]=`Bearer ${jwtToken}`
        await axios
            .post("http://localhost:9090/prescription/addPrescription", data)
            .then((response) => {
                // console.log("inside post prescription api");
                // console.log(response.data);
                // deletePtHistory()
                navigate(`/doctor`);
            })
            .catch((error) => {
                console.log("error", error);
            });
    }

    const fetchPtHistory = async () => {
        const jwtToken=localStorage.getItem("jwtToken");
        axios.defaults.headers.common["Authorization"]=`Bearer ${jwtToken}`
        await axios.get(`http://localhost:9090/fileaws/getAllFiles/${patientId}`)
            .then((response) => {
                console.log("fetched files", response.data)
                setFileList(response.data)
                setPtHistory(true)
            })
            .catch((error) => {
                console.log(error)
            })
    }

    const handleViewClick = async (fileKey) => {
        console.log(`File key:`,fileKey);
        const jwtToken=localStorage.getItem("jwtToken");
        axios.defaults.headers.common["Authorization"]=`Bearer ${jwtToken}`
        await axios.get(`http://localhost:9090/fileaws/downloadFile/${fileKey}`, { responseType: 'arraybuffer' })
            .then(response => {
                console.log("fileeeee")
                const file = new Blob([response.data], { type: 'application/pdf' });
                const fileURL = URL.createObjectURL(file);
                window.open(fileURL);
            })
            .catch(error => {
                console.log(error);
            });
    }

    // const deletePtHistory = async() => {
    //     await axios.delete(`http://localhost:9090/fileaws/deleteAllFiles/${patientId}`)
    //     .then((response) => {
    //         console.log("response of delete", response.data)
    //     })
    //     .catch((error) => {
    //         console.log(error)
    //     })
    // }

    useEffect(() => {
        fetchPatientDetail();
        getAllMedicine();
    }, []);

    return (
        <div className='w-full p-8 items-center justify-center bg-blue-50 border-l-4 border-b-4 shadow-lg border-indigo-700'>
            <div className='grid grid-cols-2'>
                {/* <div className='items-center justify-evenly'> */}
                <div className='relative z-0 w-full mb-6 group font-serif'>
                    <img src={GradientLogo} alt='logo' className='mx-auto w-48' />
                </div>
                <div className='relative z-0 w-full mb-6 group font-serif text-lg'>
                    <p>Pt.Id : {patientId}</p>
                    <p>Pt.Name : {patientDetail.firstName}</p>
                    <p>Pt.Gender : {patientDetail.gender}</p>
                    <p>Pt.Age : {ptAge}</p>
                </div>
                {/* </div> */}
            </div>
            <form className='items-center justify-evenly'>
                <div className="relative z-0 w-full mb-6 group">
                    <input type="text" name="symptom" id="symptom" autoComplete='false' className="block py-2.5 px-0 w-full text-sm text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none dark:border-gray-600 dark:focus:border-blue-500 focus:outline-none focus:ring-0 focus:border-blue-600 peer" placeholder=" " value={observation} onChange={(e) => setObservation(e.target.value)} required />
                    <label for="symptom" className="peer-focus:font-medium absolute text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:left-0 peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6">Symptom</label>
                </div>
                {inputFeilds.map((input, index) => {
                    return (
                        <div key={index}>
                            <div className='grid grid-cols-5 gap-4'>
                                <div className="col-span-4 grid md:grid-cols-3 md:gap-6" style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gridColumnGap: "1.5rem" }}>
                                    <div className="relative z-0 w-full mb-6 group" style={{ gridColumn: "1/3" }}>
                                        <input type="text" name="medicine" id="medicine" autoComplete='false' value={input.medicine} onChange={(event) => handleFormChange(index, event)} className="block py-2.5 px-0 w-full text-sm text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none dark:border-gray-600 dark:focus:border-blue-500 focus:outline-none focus:ring-0 focus:border-blue-600 peer" placeholder=" " required />
                                        <label for="medicine" className="peer-focus:font-medium absolute text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:left-0 peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6">Medicine</label>
                                    </div>
                                    <div className="relative z-0 w-full mb-6 group" style={{ gridColumn: "3/5" }}>
                                        <input type="text" name="dosage" id="dosage" autoComplete='false' value={input.dosage} onChange={(event) => handleFormChange(index, event)} className="block py-2.5 px-0 w-full text-sm text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none dark:border-gray-600 dark:focus:border-blue-500 focus:outline-none focus:ring-0 focus:border-blue-600 peer" placeholder=" " required />
                                        <label for="dosage" className="peer-focus:font-medium absolute text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:left-0 peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6">Dosage</label>
                                    </div>
                                    <div className="relative z-0 w-full mb-6 group space-x-2" style={{ gridColumn: "5/7" }}>
                                        <button onClick={() => removeFields(index)}><FontAwesomeIcon icon={faSquareMinus} size='2xl' style={{ color: "#ec0909", }} /></button>
                                    </div>
                                </div>
                                <div className='col-span-1'>
                                    <button onClick={addFields}><FontAwesomeIcon icon={faSquarePlus} size='2xl' style={{ color: "#0c4ab6", }} /></button>
                                </div>
                            </div>
                            <Dropdown
                                style={{
                                    position: "absolute",
                                    backgroundColor: "white", // Set background color to white
                                    borderRadius: "4px", // Set border radius to create rounded corners
                                    boxShadow: "0px 0px 4px rgba(0, 0, 0, 0.1)", // Add a box shadow for depth
                                    padding: "3px", // Add padding to create spacing between items
                                    zIndex: "9999",
                                    maxWidth: "35%",
                                    maxHeight: "35%",
                                    overflow: "auto",
                                }}
                            >
                                {allMedicineData
                                    .filter((item) => {
                                        const searchItem = input.medicine.toLowerCase();
                                        const medicine = item.toLowerCase();
                                        return (
                                            medicine.indexOf(searchItem) > -1 &&
                                            searchItem != medicine &&
                                            searchItem.length >= 1
                                        );
                                    })
                                    .slice(0, 10)
                                    .map((item) => (
                                        <Dropdown.Item
                                            key={item}
                                            onClick={() => {
                                                const updatedInputFields = [...inputFeilds];
                                                updatedInputFields[index].medicine = item;
                                                setInputFeilds(updatedInputFields);
                                            }}
                                            style={{
                                                // Add additional styling for each item
                                                padding: "5px 10px", // Add padding to create spacing within each item
                                            }}
                                        >
                                            {item}
                                        </Dropdown.Item>
                                    ))}
                            </Dropdown>
                        </div>
                    )
                })}
                <div className="relative z-0 w-full mb-6 group">
                    <input type="text" name="Remarks" id="Remarks" autoComplete='false' className="block py-2.5 px-0 w-full text-sm text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none dark:border-gray-600 dark:focus:border-blue-500 focus:outline-none focus:ring-0 focus:border-blue-600 peer" placeholder=" " value={advice} onChange={(e) => setAdvice(e.target.value)} required />
                    <label for="Remarks" className="peer-focus:font-medium absolute text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:left-0 peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6">Remarks</label>
                </div>
                {/* show follow-up */}
                <div className='relative z-0 w-full mb-6 group'>
                    <div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                value=""
                                className="sr-only peer"
                                checked={isDatePickerVisible}
                                onChange={handleToggle}
                                placeholder='Select Date'
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                            <span className="ml-3 text-sm font-serif text-gray-900 dark:text-gray-800">
                                Follow up
                            </span>
                        </label>
                    </div>
                    {isDatePickerVisible && (
                        <div className="relative w-1/3 mb-6 group">
                            <DatePicker
                                selected={selectedDate}
                                onChange={(date) => setSelectedDate(date)}
                                dateFormat="dd/MM/yyyy"
                                placeholderText="Add follow-up"
                                className="block w-full px-4 py-2 text-gray-700 bg-transparent border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            />
                        </div>
                    )}
                </div>
                <button type="submit" onClick={submitHandler} className="mb-6 text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">Add Prescription</button>
                {/* show patient history */}
                <div className='relative z-0 w-full mb-6 group'>
                    <div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                value=""
                                className="sr-only peer"
                                checked={showHistory}
                                onChange={handleHistory}
                                placeholder='Show Patient Medical History'
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                            <span className="ml-3 text-sm font-serif text-gray-900 dark:text-gray-800">
                                Show Patient E-Aarogya Medical History
                            </span>
                        </label>
                    </div>
                    {showHistory && (<PatientMedicalHistory patientDetail={patientDetail} />)}
                </div>
                <div className=" flex flex-col border-2 rounded-lg border-blue-300 items-center justify-center p-4">
                    <div className='flex flex-row items-center space-x-2 px-8'>
                        <p className='py-2 text-sm text-gray-900 font-serif'>Patient's Uploaded Health Records</p>
                        <button onClick={handleClick}>
                            <FontAwesomeIcon icon={faArrowsRotate} className={`text-gray-600 ${isRotating ? "animate-spin" : ""}`} />
                        </button>
                    </div>
                    {ptHistory ?
                        (<div>
                            <ul>
                                {fileList.map((file,index) => (
                                    <div className="flex flex-row p-2" key={file.Key}>
                                        <li>
                                            {file}
                                        </li>
                                        <li key={`view-${index}`}>
                                            <button className="bg-blue-400 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" onClick={() => handleViewClick(file)}>
                                                View
                                            </button>
                                        </li>
                                    </div>
                                ))}
                            </ul>
                        </div>)
                        : (<div className="flex items-center justify-center space-y-4"><p className="text-sm text-zinc-400 font-serif">No records found</p></div>
                        )}
                </div>
            </form>
        </div>

    )
}

export default Prescription