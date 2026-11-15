import { apiFetch } from "./api";

/*
* Obtiene todos los empledados de la empresa 
*/
export const getEmpleados = async () =>{
    return await apiFetch('/empleados/',{method:'GET'});
}