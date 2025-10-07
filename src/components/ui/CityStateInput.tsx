'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Input } from './Input';
import { logger } from '@/lib/logger';

// Static US cities data (comprehensive list including suburbs and towns)
const US_CITIES = [
  // New York State - Major Cities and Suburbs
  { city: 'New York', state: 'New York', stateCode: 'NY' },
  { city: 'Brooklyn', state: 'New York', stateCode: 'NY' },
  { city: 'Queens', state: 'New York', stateCode: 'NY' },
  { city: 'Bronx', state: 'New York', stateCode: 'NY' },
  { city: 'Manhattan', state: 'New York', stateCode: 'NY' },
  { city: 'Staten Island', state: 'New York', stateCode: 'NY' },
  { city: 'Buffalo', state: 'New York', stateCode: 'NY' },
  { city: 'Rochester', state: 'New York', stateCode: 'NY' },
  { city: 'Yonkers', state: 'New York', stateCode: 'NY' },
  { city: 'Syracuse', state: 'New York', stateCode: 'NY' },
  { city: 'Albany', state: 'New York', stateCode: 'NY' },
  { city: 'New Rochelle', state: 'New York', stateCode: 'NY' },
  { city: 'Mount Vernon', state: 'New York', stateCode: 'NY' },
  { city: 'Schenectady', state: 'New York', stateCode: 'NY' },
  { city: 'Utica', state: 'New York', stateCode: 'NY' },
  { city: 'White Plains', state: 'New York', stateCode: 'NY' },
  { city: 'Troy', state: 'New York', stateCode: 'NY' },
  { city: 'Niagara Falls', state: 'New York', stateCode: 'NY' },
  { city: 'Binghamton', state: 'New York', stateCode: 'NY' },
  { city: 'Freeport', state: 'New York', stateCode: 'NY' },
  { city: 'Valley Stream', state: 'New York', stateCode: 'NY' },
  { city: 'Long Beach', state: 'New York', stateCode: 'NY' },
  { city: 'Rome', state: 'New York', stateCode: 'NY' },
  { city: 'Ithaca', state: 'New York', stateCode: 'NY' },
  { city: 'Poughkeepsie', state: 'New York', stateCode: 'NY' },
  { city: 'Newburgh', state: 'New York', stateCode: 'NY' },
  { city: 'Kingston', state: 'New York', stateCode: 'NY' },
  { city: 'Middletown', state: 'New York', stateCode: 'NY' },
  { city: 'Watertown', state: 'New York', stateCode: 'NY' },
  { city: 'Elmira', state: 'New York', stateCode: 'NY' },
  { city: 'Glens Falls', state: 'New York', stateCode: 'NY' },
  { city: 'Batavia', state: 'New York', stateCode: 'NY' },
  { city: 'Auburn', state: 'New York', stateCode: 'NY' },
  { city: 'Oswego', state: 'New York', stateCode: 'NY' },
  { city: 'Cortland', state: 'New York', stateCode: 'NY' },
  { city: 'Oneonta', state: 'New York', stateCode: 'NY' },
  { city: 'Plattsburgh', state: 'New York', stateCode: 'NY' },
  { city: 'Saratoga Springs', state: 'New York', stateCode: 'NY' },
  { city: 'Jamestown', state: 'New York', stateCode: 'NY' },
  { city: 'Peekskill', state: 'New York', stateCode: 'NY' },
  { city: 'Cohoes', state: 'New York', stateCode: 'NY' },
  { city: 'Rensselaer', state: 'New York', stateCode: 'NY' },
  { city: 'Watervliet', state: 'New York', stateCode: 'NY' },
  { city: 'Beacon', state: 'New York', stateCode: 'NY' },
  { city: 'Port Chester', state: 'New York', stateCode: 'NY' },
  { city: 'Rye', state: 'New York', stateCode: 'NY' },
  { city: 'Mamaroneck', state: 'New York', stateCode: 'NY' },
  { city: 'Harrison', state: 'New York', stateCode: 'NY' },
  { city: 'Mount Kisco', state: 'New York', stateCode: 'NY' },
  { city: 'Sleepy Hollow', state: 'New York', stateCode: 'NY' },
  { city: 'Tarrytown', state: 'New York', stateCode: 'NY' },
  { city: 'Dobbs Ferry', state: 'New York', stateCode: 'NY' },
  { city: 'Hastings-on-Hudson', state: 'New York', stateCode: 'NY' },
  { city: 'Irvington', state: 'New York', stateCode: 'NY' },
  { city: 'Ossining', state: 'New York', stateCode: 'NY' },
  { city: 'Croton-on-Hudson', state: 'New York', stateCode: 'NY' },
  { city: 'Briarcliff Manor', state: 'New York', stateCode: 'NY' },
  { city: 'Pleasantville', state: 'New York', stateCode: 'NY' },
  { city: 'Mount Pleasant', state: 'New York', stateCode: 'NY' },
  { city: 'North Castle', state: 'New York', stateCode: 'NY' },
  { city: 'Bedford', state: 'New York', stateCode: 'NY' },
  { city: 'Lewisboro', state: 'New York', stateCode: 'NY' },
  { city: 'Pound Ridge', state: 'New York', stateCode: 'NY' },
  { city: 'Somers', state: 'New York', stateCode: 'NY' },
  { city: 'Yorktown', state: 'New York', stateCode: 'NY' },
  { city: 'Cortlandt', state: 'New York', stateCode: 'NY' },
  { city: 'Putnam Valley', state: 'New York', stateCode: 'NY' },
  { city: 'Carmel', state: 'New York', stateCode: 'NY' },
  { city: 'Kent', state: 'New York', stateCode: 'NY' },
  { city: 'Patterson', state: 'New York', stateCode: 'NY' },
  { city: 'Southeast', state: 'New York', stateCode: 'NY' },
  { city: 'Brewster', state: 'New York', stateCode: 'NY' },
  { city: 'Mahopac', state: 'New York', stateCode: 'NY' },
  { city: 'Cold Spring', state: 'New York', stateCode: 'NY' },
  { city: 'Garrison', state: 'New York', stateCode: 'NY' },
  { city: 'Philipstown', state: 'New York', stateCode: 'NY' },
  { city: 'Nelsonville', state: 'New York', stateCode: 'NY' },
  { city: 'Fishkill', state: 'New York', stateCode: 'NY' },
  { city: 'Wappinger', state: 'New York', stateCode: 'NY' },
  { city: 'East Fishkill', state: 'New York', stateCode: 'NY' },
  { city: 'LaGrange', state: 'New York', stateCode: 'NY' },
  { city: 'Union Vale', state: 'New York', stateCode: 'NY' },
  { city: 'Washington', state: 'New York', stateCode: 'NY' },
  { city: 'Stanford', state: 'New York', stateCode: 'NY' },
  { city: 'Pine Plains', state: 'New York', stateCode: 'NY' },
  { city: 'North East', state: 'New York', stateCode: 'NY' },
  { city: 'Amenia', state: 'New York', stateCode: 'NY' },
  { city: 'Dover', state: 'New York', stateCode: 'NY' },
  { city: 'Pawling', state: 'New York', stateCode: 'NY' },
  { city: 'Beekman', state: 'New York', stateCode: 'NY' },
  { city: 'Hyde Park', state: 'New York', stateCode: 'NY' },
  { city: 'Clinton', state: 'New York', stateCode: 'NY' },
  { city: 'Rhinebeck', state: 'New York', stateCode: 'NY' },
  { city: 'Red Hook', state: 'New York', stateCode: 'NY' },
  { city: 'Tivoli', state: 'New York', stateCode: 'NY' },
  { city: 'Germantown', state: 'New York', stateCode: 'NY' },
  { city: 'Livingston', state: 'New York', stateCode: 'NY' },
  { city: 'Gallatin', state: 'New York', stateCode: 'NY' },
  { city: 'Ancram', state: 'New York', stateCode: 'NY' },
  { city: 'Taghkanic', state: 'New York', stateCode: 'NY' },
  { city: 'Copake', state: 'New York', stateCode: 'NY' },
  { city: 'Hillsdale', state: 'New York', stateCode: 'NY' },
  { city: 'Claverack', state: 'New York', stateCode: 'NY' },
  { city: 'Ghent', state: 'New York', stateCode: 'NY' },
  { city: 'Kinderhook', state: 'New York', stateCode: 'NY' },
  { city: 'Stuyvesant', state: 'New York', stateCode: 'NY' },
  { city: 'Stockport', state: 'New York', stateCode: 'NY' },
  { city: 'Greenport', state: 'New York', stateCode: 'NY' },
  { city: 'Hudson', state: 'New York', stateCode: 'NY' },
  { city: 'Athens', state: 'New York', stateCode: 'NY' },
  { city: 'Catskill', state: 'New York', stateCode: 'NY' },
  { city: 'Coxsackie', state: 'New York', stateCode: 'NY' },
  { city: 'New Baltimore', state: 'New York', stateCode: 'NY' },
  { city: 'Durham', state: 'New York', stateCode: 'NY' },
  { city: 'Greenville', state: 'New York', stateCode: 'NY' },
  { city: 'Windham', state: 'New York', stateCode: 'NY' },
  { city: 'Ashland', state: 'New York', stateCode: 'NY' },
  { city: 'Halcott', state: 'New York', stateCode: 'NY' },
  { city: 'Lexington', state: 'New York', stateCode: 'NY' },
  { city: 'Prattsville', state: 'New York', stateCode: 'NY' },
  { city: 'Jewett', state: 'New York', stateCode: 'NY' },
  { city: 'Hunter', state: 'New York', stateCode: 'NY' },
  { city: 'Lanesville', state: 'New York', stateCode: 'NY' },
  { city: 'Tannersville', state: 'New York', stateCode: 'NY' },
  { city: 'Cairo', state: 'New York', stateCode: 'NY' },
  { city: 'Catskill', state: 'New York', stateCode: 'NY' },
  { city: 'Coxsackie', state: 'New York', stateCode: 'NY' },
  { city: 'New Baltimore', state: 'New York', stateCode: 'NY' },
  { city: 'Durham', state: 'New York', stateCode: 'NY' },
  { city: 'Greenville', state: 'New York', stateCode: 'NY' },
  { city: 'Windham', state: 'New York', stateCode: 'NY' },
  { city: 'Ashland', state: 'New York', stateCode: 'NY' },
  { city: 'Halcott', state: 'New York', stateCode: 'NY' },
  { city: 'Lexington', state: 'New York', stateCode: 'NY' },
  { city: 'Prattsville', state: 'New York', stateCode: 'NY' },
  { city: 'Jewett', state: 'New York', stateCode: 'NY' },
  { city: 'Hunter', state: 'New York', stateCode: 'NY' },
  { city: 'Lanesville', state: 'New York', stateCode: 'NY' },
  { city: 'Tannersville', state: 'New York', stateCode: 'NY' },
  { city: 'Cairo', state: 'New York', stateCode: 'NY' },
  { city: 'Franklin Square', state: 'New York', stateCode: 'NY' },
  { city: 'West Hempstead', state: 'New York', stateCode: 'NY' },
  { city: 'East Meadow', state: 'New York', stateCode: 'NY' },
  { city: 'Levittown', state: 'New York', stateCode: 'NY' },
  { city: 'Hempstead', state: 'New York', stateCode: 'NY' },
  { city: 'Uniondale', state: 'New York', stateCode: 'NY' },
  { city: 'Garden City', state: 'New York', stateCode: 'NY' },
  { city: 'Mineola', state: 'New York', stateCode: 'NY' },
  { city: 'New Hyde Park', state: 'New York', stateCode: 'NY' },
  { city: 'Floral Park', state: 'New York', stateCode: 'NY' },
  { city: 'Elmont', state: 'New York', stateCode: 'NY' },
  { city: 'Valley Stream', state: 'New York', stateCode: 'NY' },
  { city: 'Lynbrook', state: 'New York', stateCode: 'NY' },
  { city: 'Malverne', state: 'New York', stateCode: 'NY' },
  { city: 'Rockville Centre', state: 'New York', stateCode: 'NY' },
  { city: 'Baldwin', state: 'New York', stateCode: 'NY' },
  { city: 'Freeport', state: 'New York', stateCode: 'NY' },
  { city: 'Merrick', state: 'New York', stateCode: 'NY' },
  { city: 'Bellmore', state: 'New York', stateCode: 'NY' },
  { city: 'Wantagh', state: 'New York', stateCode: 'NY' },
  { city: 'Seaford', state: 'New York', stateCode: 'NY' },
  { city: 'Massapequa', state: 'New York', stateCode: 'NY' },
  { city: 'Massapequa Park', state: 'New York', stateCode: 'NY' },
  { city: 'Amityville', state: 'New York', stateCode: 'NY' },
  { city: 'Lindenhurst', state: 'New York', stateCode: 'NY' },
  { city: 'Babylon', state: 'New York', stateCode: 'NY' },
  { city: 'West Babylon', state: 'New York', stateCode: 'NY' },
  { city: 'North Babylon', state: 'New York', stateCode: 'NY' },
  { city: 'Deer Park', state: 'New York', stateCode: 'NY' },
  { city: 'Wyandanch', state: 'New York', stateCode: 'NY' },
  { city: 'Wheatley Heights', state: 'New York', stateCode: 'NY' },
  { city: 'Dix Hills', state: 'New York', stateCode: 'NY' },
  { city: 'Huntington', state: 'New York', stateCode: 'NY' },
  { city: 'Huntington Station', state: 'New York', stateCode: 'NY' },
  { city: 'South Huntington', state: 'New York', stateCode: 'NY' },
  { city: 'Melville', state: 'New York', stateCode: 'NY' },
  { city: 'Commack', state: 'New York', stateCode: 'NY' },
  { city: 'Smithtown', state: 'New York', stateCode: 'NY' },
  { city: 'Kings Park', state: 'New York', stateCode: 'NY' },
  { city: 'Sanford', state: 'New York', stateCode: 'NY' },
  { city: 'Fort Salonga', state: 'New York', stateCode: 'NY' },
  { city: 'Nissequogue', state: 'New York', stateCode: 'NY' },
  { city: 'Head of the Harbor', state: 'New York', stateCode: 'NY' },
  { city: 'Village of the Branch', state: 'New York', stateCode: 'NY' },
  { city: 'Hauppauge', state: 'New York', stateCode: 'NY' },
  { city: 'Islandia', state: 'New York', stateCode: 'NY' },
  { city: 'Lake Grove', state: 'New York', stateCode: 'NY' },
  { city: 'Lake Ronkonkoma', state: 'New York', stateCode: 'NY' },
  { city: 'Ronkonkoma', state: 'New York', stateCode: 'NY' },
  { city: 'Holbrook', state: 'New York', stateCode: 'NY' },
  { city: 'Holtsville', state: 'New York', stateCode: 'NY' },
  { city: 'Farmingville', state: 'New York', stateCode: 'NY' },
  { city: 'Centereach', state: 'New York', stateCode: 'NY' },
  { city: 'Selden', state: 'New York', stateCode: 'NY' },
  { city: 'Coram', state: 'New York', stateCode: 'NY' },
  { city: 'Middle Island', state: 'New York', stateCode: 'NY' },
  { city: 'Ridge', state: 'New York', stateCode: 'NY' },
  { city: 'Yaphank', state: 'New York', stateCode: 'NY' },
  { city: 'Brookhaven', state: 'New York', stateCode: 'NY' },
  { city: 'Shirley', state: 'New York', stateCode: 'NY' },
  { city: 'Mastic', state: 'New York', stateCode: 'NY' },
  { city: 'Mastic Beach', state: 'New York', stateCode: 'NY' },
  { city: 'East Moriches', state: 'New York', stateCode: 'NY' },
  { city: 'Center Moriches', state: 'New York', stateCode: 'NY' },
  { city: 'Moriches', state: 'New York', stateCode: 'NY' },
  { city: 'Eastport', state: 'New York', stateCode: 'NY' },
  { city: 'Manorville', state: 'New York', stateCode: 'NY' },
  { city: 'Calverton', state: 'New York', stateCode: 'NY' },
  { city: 'Riverhead', state: 'New York', stateCode: 'NY' },
  { city: 'Aquebogue', state: 'New York', stateCode: 'NY' },
  { city: 'Jamesport', state: 'New York', stateCode: 'NY' },
  { city: 'Laurel', state: 'New York', stateCode: 'NY' },
  { city: 'Mattituck', state: 'New York', stateCode: 'NY' },
  { city: 'Cutchogue', state: 'New York', stateCode: 'NY' },
  { city: 'Southold', state: 'New York', stateCode: 'NY' },
  { city: 'Greenport', state: 'New York', stateCode: 'NY' },
  { city: 'Orient', state: 'New York', stateCode: 'NY' },
  { city: 'East Marion', state: 'New York', stateCode: 'NY' },
  { city: 'Shelter Island', state: 'New York', stateCode: 'NY' },
  { city: 'Shelter Island Heights', state: 'New York', stateCode: 'NY' },
  { city: 'Dering Harbor', state: 'New York', stateCode: 'NY' },
  { city: 'Sag Harbor', state: 'New York', stateCode: 'NY' },
  { city: 'North Haven', state: 'New York', stateCode: 'NY' },
  { city: 'Sagaponack', state: 'New York', stateCode: 'NY' },
  { city: 'Bridgehampton', state: 'New York', stateCode: 'NY' },
  { city: 'Water Mill', state: 'New York', stateCode: 'NY' },
  { city: 'Southampton', state: 'New York', stateCode: 'NY' },
  { city: 'North Sea', state: 'New York', stateCode: 'NY' },
  { city: 'Noyac', state: 'New York', stateCode: 'NY' },
  { city: 'East Hampton', state: 'New York', stateCode: 'NY' },
  { city: 'Amagansett', state: 'New York', stateCode: 'NY' },
  { city: 'Montauk', state: 'New York', stateCode: 'NY' },
  { city: 'Springs', state: 'New York', stateCode: 'NY' },
  { city: 'Wainscott', state: 'New York', stateCode: 'NY' },
  { city: 'East Quogue', state: 'New York', stateCode: 'NY' },
  { city: 'Quogue', state: 'New York', stateCode: 'NY' },
  { city: 'Remsenburg', state: 'New York', stateCode: 'NY' },
  { city: 'Speonk', state: 'New York', stateCode: 'NY' },
  { city: 'Westhampton', state: 'New York', stateCode: 'NY' },
  { city: 'Westhampton Beach', state: 'New York', stateCode: 'NY' },
  { city: 'Hampton Bays', state: 'New York', stateCode: 'NY' },
  { city: 'Flanders', state: 'New York', stateCode: 'NY' },
  { city: 'Riverside', state: 'New York', stateCode: 'NY' },
  { city: 'Northampton', state: 'New York', stateCode: 'NY' },
  { city: 'Tuckahoe', state: 'New York', stateCode: 'NY' },
  { city: 'Eastchester', state: 'New York', stateCode: 'NY' },
  { city: 'Bronxville', state: 'New York', stateCode: 'NY' },
  { city: 'Tuckahoe', state: 'New York', stateCode: 'NY' },
  { city: 'Eastchester', state: 'New York', stateCode: 'NY' },
  { city: 'Bronxville', state: 'New York', stateCode: 'NY' },
  { city: 'Scarsdale', state: 'New York', stateCode: 'NY' },
  { city: 'Edgemont', state: 'New York', stateCode: 'NY' },
  { city: 'Greenburgh', state: 'New York', stateCode: 'NY' },
  { city: 'Elmsford', state: 'New York', stateCode: 'NY' },
  { city: 'Ardsley', state: 'New York', stateCode: 'NY' },
  { city: 'Dobbs Ferry', state: 'New York', stateCode: 'NY' },
  { city: 'Hastings-on-Hudson', state: 'New York', stateCode: 'NY' },
  { city: 'Irvington', state: 'New York', stateCode: 'NY' },
  { city: 'Ossining', state: 'New York', stateCode: 'NY' },
  { city: 'Croton-on-Hudson', state: 'New York', stateCode: 'NY' },
  { city: 'Briarcliff Manor', state: 'New York', stateCode: 'NY' },
  { city: 'Pleasantville', state: 'New York', stateCode: 'NY' },
  { city: 'Mount Pleasant', state: 'New York', stateCode: 'NY' },
  { city: 'North Castle', state: 'New York', stateCode: 'NY' },
  { city: 'Bedford', state: 'New York', stateCode: 'NY' },
  { city: 'Lewisboro', state: 'New York', stateCode: 'NY' },
  { city: 'Pound Ridge', state: 'New York', stateCode: 'NY' },
  { city: 'Somers', state: 'New York', stateCode: 'NY' },
  { city: 'Yorktown', state: 'New York', stateCode: 'NY' },
  { city: 'Cortlandt', state: 'New York', stateCode: 'NY' },
  { city: 'Putnam Valley', state: 'New York', stateCode: 'NY' },
  { city: 'Carmel', state: 'New York', stateCode: 'NY' },
  { city: 'Kent', state: 'New York', stateCode: 'NY' },
  { city: 'Patterson', state: 'New York', stateCode: 'NY' },
  { city: 'Southeast', state: 'New York', stateCode: 'NY' },
  { city: 'Brewster', state: 'New York', stateCode: 'NY' },
  { city: 'Mahopac', state: 'New York', stateCode: 'NY' },
  { city: 'Cold Spring', state: 'New York', stateCode: 'NY' },
  { city: 'Garrison', state: 'New York', stateCode: 'NY' },
  { city: 'Philipstown', state: 'New York', stateCode: 'NY' },
  { city: 'Nelsonville', state: 'New York', stateCode: 'NY' },
  { city: 'Fishkill', state: 'New York', stateCode: 'NY' },
  { city: 'Wappinger', state: 'New York', stateCode: 'NY' },
  { city: 'East Fishkill', state: 'New York', stateCode: 'NY' },
  { city: 'LaGrange', state: 'New York', stateCode: 'NY' },
  { city: 'Union Vale', state: 'New York', stateCode: 'NY' },
  { city: 'Washington', state: 'New York', stateCode: 'NY' },
  { city: 'Stanford', state: 'New York', stateCode: 'NY' },
  { city: 'Pine Plains', state: 'New York', stateCode: 'NY' },
  { city: 'North East', state: 'New York', stateCode: 'NY' },
  { city: 'Amenia', state: 'New York', stateCode: 'NY' },
  { city: 'Dover', state: 'New York', stateCode: 'NY' },
  { city: 'Pawling', state: 'New York', stateCode: 'NY' },
  { city: 'Beekman', state: 'New York', stateCode: 'NY' },
  { city: 'Hyde Park', state: 'New York', stateCode: 'NY' },
  { city: 'Clinton', state: 'New York', stateCode: 'NY' },
  { city: 'Rhinebeck', state: 'New York', stateCode: 'NY' },
  { city: 'Red Hook', state: 'New York', stateCode: 'NY' },
  { city: 'Tivoli', state: 'New York', stateCode: 'NY' },
  { city: 'Germantown', state: 'New York', stateCode: 'NY' },
  { city: 'Livingston', state: 'New York', stateCode: 'NY' },
  { city: 'Gallatin', state: 'New York', stateCode: 'NY' },
  { city: 'Ancram', state: 'New York', stateCode: 'NY' },
  { city: 'Taghkanic', state: 'New York', stateCode: 'NY' },
  { city: 'Copake', state: 'New York', stateCode: 'NY' },
  { city: 'Hillsdale', state: 'New York', stateCode: 'NY' },
  { city: 'Claverack', state: 'New York', stateCode: 'NY' },
  { city: 'Ghent', state: 'New York', stateCode: 'NY' },
  { city: 'Kinderhook', state: 'New York', stateCode: 'NY' },
  { city: 'Stuyvesant', state: 'New York', stateCode: 'NY' },
  { city: 'Stockport', state: 'New York', stateCode: 'NY' },
  { city: 'Greenport', state: 'New York', stateCode: 'NY' },
  { city: 'Hudson', state: 'New York', stateCode: 'NY' },
  { city: 'Athens', state: 'New York', stateCode: 'NY' },
  { city: 'Catskill', state: 'New York', stateCode: 'NY' },
  { city: 'Coxsackie', state: 'New York', stateCode: 'NY' },
  { city: 'New Baltimore', state: 'New York', stateCode: 'NY' },
  { city: 'Durham', state: 'New York', stateCode: 'NY' },
  { city: 'Greenville', state: 'New York', stateCode: 'NY' },
  { city: 'Windham', state: 'New York', stateCode: 'NY' },
  { city: 'Ashland', state: 'New York', stateCode: 'NY' },
  { city: 'Halcott', state: 'New York', stateCode: 'NY' },
  { city: 'Lexington', state: 'New York', stateCode: 'NY' },
  { city: 'Prattsville', state: 'New York', stateCode: 'NY' },
  { city: 'Jewett', state: 'New York', stateCode: 'NY' },
  { city: 'Hunter', state: 'New York', stateCode: 'NY' },
  { city: 'Lanesville', state: 'New York', stateCode: 'NY' },
  { city: 'Tannersville', state: 'New York', stateCode: 'NY' },
  { city: 'Cairo', state: 'New York', stateCode: 'NY' },
  { city: 'Los Angeles', state: 'California', stateCode: 'CA' },
  { city: 'San Francisco', state: 'California', stateCode: 'CA' },
  { city: 'San Diego', state: 'California', stateCode: 'CA' },
  { city: 'San Jose', state: 'California', stateCode: 'CA' },
  { city: 'Fresno', state: 'California', stateCode: 'CA' },
  { city: 'Sacramento', state: 'California', stateCode: 'CA' },
  { city: 'Long Beach', state: 'California', stateCode: 'CA' },
  { city: 'Oakland', state: 'California', stateCode: 'CA' },
  { city: 'Bakersfield', state: 'California', stateCode: 'CA' },
  { city: 'Anaheim', state: 'California', stateCode: 'CA' },
  { city: 'Santa Ana', state: 'California', stateCode: 'CA' },
  { city: 'Riverside', state: 'California', stateCode: 'CA' },
  { city: 'Stockton', state: 'California', stateCode: 'CA' },
  { city: 'Irvine', state: 'California', stateCode: 'CA' },
  { city: 'Chula Vista', state: 'California', stateCode: 'CA' },
  { city: 'Fremont', state: 'California', stateCode: 'CA' },
  { city: 'San Bernardino', state: 'California', stateCode: 'CA' },
  { city: 'Modesto', state: 'California', stateCode: 'CA' },
  { city: 'Fontana', state: 'California', stateCode: 'CA' },
  { city: 'Oxnard', state: 'California', stateCode: 'CA' },
  { city: 'Moreno Valley', state: 'California', stateCode: 'CA' },
  { city: 'Huntington Beach', state: 'California', stateCode: 'CA' },
  { city: 'Glendale', state: 'California', stateCode: 'CA' },
  { city: 'Santa Clarita', state: 'California', stateCode: 'CA' },
  { city: 'Garden Grove', state: 'California', stateCode: 'CA' },
  { city: 'Oceanside', state: 'California', stateCode: 'CA' },
  { city: 'Rancho Cucamonga', state: 'California', stateCode: 'CA' },
  { city: 'Santa Rosa', state: 'California', stateCode: 'CA' },
  { city: 'Ontario', state: 'California', stateCode: 'CA' },
  { city: 'Lancaster', state: 'California', stateCode: 'CA' },
  { city: 'Elk Grove', state: 'California', stateCode: 'CA' },
  { city: 'Corona', state: 'California', stateCode: 'CA' },
  { city: 'Palmdale', state: 'California', stateCode: 'CA' },
  { city: 'Salinas', state: 'California', stateCode: 'CA' },
  { city: 'Pomona', state: 'California', stateCode: 'CA' },
  { city: 'Hayward', state: 'California', stateCode: 'CA' },
  { city: 'Escondido', state: 'California', stateCode: 'CA' },
  { city: 'Torrance', state: 'California', stateCode: 'CA' },
  { city: 'Sunnyvale', state: 'California', stateCode: 'CA' },
  { city: 'Orange', state: 'California', stateCode: 'CA' },
  { city: 'Fullerton', state: 'California', stateCode: 'CA' },
  { city: 'Pasadena', state: 'California', stateCode: 'CA' },
  { city: 'Thousand Oaks', state: 'California', stateCode: 'CA' },
  { city: 'Visalia', state: 'California', stateCode: 'CA' },
  { city: 'Simi Valley', state: 'California', stateCode: 'CA' },
  { city: 'Concord', state: 'California', stateCode: 'CA' },
  { city: 'Roseville', state: 'California', stateCode: 'CA' },
  { city: 'Vallejo', state: 'California', stateCode: 'CA' },
  { city: 'Santa Clara', state: 'California', stateCode: 'CA' },
  { city: 'Victorville', state: 'California', stateCode: 'CA' },
  { city: 'El Monte', state: 'California', stateCode: 'CA' },
  { city: 'Berkeley', state: 'California', stateCode: 'CA' },
  { city: 'Downey', state: 'California', stateCode: 'CA' },
  { city: 'Costa Mesa', state: 'California', stateCode: 'CA' },
  { city: 'Inglewood', state: 'California', stateCode: 'CA' },
  { city: 'Ventura', state: 'California', stateCode: 'CA' },
  { city: 'West Covina', state: 'California', stateCode: 'CA' },
  { city: 'Norwalk', state: 'California', stateCode: 'CA' },
  { city: 'Carlsbad', state: 'California', stateCode: 'CA' },
  { city: 'Fairfield', state: 'California', stateCode: 'CA' },
  { city: 'Richmond', state: 'California', stateCode: 'CA' },
  { city: 'Murrieta', state: 'California', stateCode: 'CA' },
  { city: 'Antioch', state: 'California', stateCode: 'CA' },
  { city: 'Daly City', state: 'California', stateCode: 'CA' },
  { city: 'Santa Monica', state: 'California', stateCode: 'CA' },
  { city: 'Temecula', state: 'California', stateCode: 'CA' },
  { city: 'Clovis', state: 'California', stateCode: 'CA' },
  { city: 'Compton', state: 'California', stateCode: 'CA' },
  { city: 'Jurupa Valley', state: 'California', stateCode: 'CA' },
  { city: 'Vista', state: 'California', stateCode: 'CA' },
  { city: 'South Gate', state: 'California', stateCode: 'CA' },
  { city: 'Mission Viejo', state: 'California', stateCode: 'CA' },
  { city: 'Vacaville', state: 'California', stateCode: 'CA' },
  { city: 'Carson', state: 'California', stateCode: 'CA' },
  { city: 'Hesperia', state: 'California', stateCode: 'CA' },
  { city: 'Santa Maria', state: 'California', stateCode: 'CA' },
  { city: 'Westminster', state: 'California', stateCode: 'CA' },
  { city: 'Redding', state: 'California', stateCode: 'CA' },
  { city: 'Santa Barbara', state: 'California', stateCode: 'CA' },
  { city: 'Chico', state: 'California', stateCode: 'CA' },
  { city: 'Newport Beach', state: 'California', stateCode: 'CA' },
  { city: 'San Leandro', state: 'California', stateCode: 'CA' },
  { city: 'Hawthorne', state: 'California', stateCode: 'CA' },
  { city: 'Citrus Heights', state: 'California', stateCode: 'CA' },
  { city: 'Tracy', state: 'California', stateCode: 'CA' },
  { city: 'Alhambra', state: 'California', stateCode: 'CA' },
  { city: 'Livermore', state: 'California', stateCode: 'CA' },
  { city: 'Buena Park', state: 'California', stateCode: 'CA' },
  { city: 'Menifee', state: 'California', stateCode: 'CA' },
  { city: 'Hemet', state: 'California', stateCode: 'CA' },
  { city: 'Lakewood', state: 'California', stateCode: 'CA' },
  { city: 'Merced', state: 'California', stateCode: 'CA' },
  { city: 'Chino', state: 'California', stateCode: 'CA' },
  { city: 'Newark', state: 'California', stateCode: 'CA' },
  { city: 'San Marcos', state: 'California', stateCode: 'CA' },
  { city: 'San Ramon', state: 'California', stateCode: 'CA' },
  { city: 'Cupertino', state: 'California', stateCode: 'CA' },
  { city: 'Redwood City', state: 'California', stateCode: 'CA' },
  { city: 'Yorba Linda', state: 'California', stateCode: 'CA' },
  { city: 'Madera', state: 'California', stateCode: 'CA' },
  { city: 'Chino Hills', state: 'California', stateCode: 'CA' },
  { city: 'Redondo Beach', state: 'California', stateCode: 'CA' },
  { city: 'Mountain View', state: 'California', stateCode: 'CA' },
  { city: 'Alameda', state: 'California', stateCode: 'CA' },
  { city: 'Lake Forest', state: 'California', stateCode: 'CA' },
  { city: 'Napa', state: 'California', stateCode: 'CA' },
  { city: 'Turlock', state: 'California', stateCode: 'CA' },
  { city: 'Bellflower', state: 'California', stateCode: 'CA' },
  { city: 'Palo Alto', state: 'California', stateCode: 'CA' },
  { city: 'San Mateo', state: 'California', stateCode: 'CA' },
  { city: 'Camarillo', state: 'California', stateCode: 'CA' },
  { city: 'Baldwin Park', state: 'California', stateCode: 'CA' },
  { city: 'Upland', state: 'California', stateCode: 'CA' },
  { city: 'San Luis Obispo', state: 'California', stateCode: 'CA' },
  { city: 'Folsom', state: 'California', stateCode: 'CA' },
  { city: 'Pleasanton', state: 'California', stateCode: 'CA' },
  { city: 'Union City', state: 'California', stateCode: 'CA' },
  { city: 'Apple Valley', state: 'California', stateCode: 'CA' },
  { city: 'Tulare', state: 'California', stateCode: 'CA' },
  { city: 'Rancho Cordova', state: 'California', stateCode: 'CA' },
  { city: 'Perris', state: 'California', stateCode: 'CA' },
  { city: 'Manteca', state: 'California', stateCode: 'CA' },
  { city: 'Irvine', state: 'California', stateCode: 'CA' },
  { city: 'Chula Vista', state: 'California', stateCode: 'CA' },
  { city: 'Fremont', state: 'California', stateCode: 'CA' },
  { city: 'San Bernardino', state: 'California', stateCode: 'CA' },
  { city: 'Modesto', state: 'California', stateCode: 'CA' },
  { city: 'Fontana', state: 'California', stateCode: 'CA' },
  { city: 'Oxnard', state: 'California', stateCode: 'CA' },
  { city: 'Moreno Valley', state: 'California', stateCode: 'CA' },
  { city: 'Huntington Beach', state: 'California', stateCode: 'CA' },
  { city: 'Glendale', state: 'California', stateCode: 'CA' },
  { city: 'Santa Clarita', state: 'California', stateCode: 'CA' },
  { city: 'Garden Grove', state: 'California', stateCode: 'CA' },
  { city: 'Oceanside', state: 'California', stateCode: 'CA' },
  { city: 'Rancho Cucamonga', state: 'California', stateCode: 'CA' },
  { city: 'Santa Rosa', state: 'California', stateCode: 'CA' },
  { city: 'Ontario', state: 'California', stateCode: 'CA' },
  { city: 'Lancaster', state: 'California', stateCode: 'CA' },
  { city: 'Elk Grove', state: 'California', stateCode: 'CA' },
  { city: 'Corona', state: 'California', stateCode: 'CA' },
  { city: 'Palmdale', state: 'California', stateCode: 'CA' },
  { city: 'Salinas', state: 'California', stateCode: 'CA' },
  { city: 'Pomona', state: 'California', stateCode: 'CA' },
  { city: 'Hayward', state: 'California', stateCode: 'CA' },
  { city: 'Escondido', state: 'California', stateCode: 'CA' },
  { city: 'Torrance', state: 'California', stateCode: 'CA' },
  { city: 'Sunnyvale', state: 'California', stateCode: 'CA' },
  { city: 'Orange', state: 'California', stateCode: 'CA' },
  { city: 'Fullerton', state: 'California', stateCode: 'CA' },
  { city: 'Pasadena', state: 'California', stateCode: 'CA' },
  { city: 'Thousand Oaks', state: 'California', stateCode: 'CA' },
  { city: 'Visalia', state: 'California', stateCode: 'CA' },
  { city: 'Simi Valley', state: 'California', stateCode: 'CA' },
  { city: 'Concord', state: 'California', stateCode: 'CA' },
  { city: 'Roseville', state: 'California', stateCode: 'CA' },
  { city: 'Vallejo', state: 'California', stateCode: 'CA' },
  { city: 'Santa Clara', state: 'California', stateCode: 'CA' },
  { city: 'Victorville', state: 'California', stateCode: 'CA' },
  { city: 'El Monte', state: 'California', stateCode: 'CA' },
  { city: 'Berkeley', state: 'California', stateCode: 'CA' },
  { city: 'Downey', state: 'California', stateCode: 'CA' },
  { city: 'Costa Mesa', state: 'California', stateCode: 'CA' },
  { city: 'Inglewood', state: 'California', stateCode: 'CA' },
  { city: 'Ventura', state: 'California', stateCode: 'CA' },
  { city: 'West Covina', state: 'California', stateCode: 'CA' },
  { city: 'Norwalk', state: 'California', stateCode: 'CA' },
  { city: 'Carlsbad', state: 'California', stateCode: 'CA' },
  { city: 'Fairfield', state: 'California', stateCode: 'CA' },
  { city: 'Richmond', state: 'California', stateCode: 'CA' },
  { city: 'Murrieta', state: 'California', stateCode: 'CA' },
  { city: 'Antioch', state: 'California', stateCode: 'CA' },
  { city: 'Daly City', state: 'California', stateCode: 'CA' },
  { city: 'Santa Monica', state: 'California', stateCode: 'CA' },
  { city: 'Temecula', state: 'California', stateCode: 'CA' },
  { city: 'Clovis', state: 'California', stateCode: 'CA' },
  { city: 'Compton', state: 'California', stateCode: 'CA' },
  { city: 'Jurupa Valley', state: 'California', stateCode: 'CA' },
  { city: 'Vista', state: 'California', stateCode: 'CA' },
  { city: 'South Gate', state: 'California', stateCode: 'CA' },
  { city: 'Mission Viejo', state: 'California', stateCode: 'CA' },
  { city: 'Vacaville', state: 'California', stateCode: 'CA' },
  { city: 'Carson', state: 'California', stateCode: 'CA' },
  { city: 'Hesperia', state: 'California', stateCode: 'CA' },
  { city: 'Santa Maria', state: 'California', stateCode: 'CA' },
  { city: 'Westminster', state: 'California', stateCode: 'CA' },
  { city: 'Redding', state: 'California', stateCode: 'CA' },
  { city: 'Santa Barbara', state: 'California', stateCode: 'CA' },
  { city: 'Chico', state: 'California', stateCode: 'CA' },
  { city: 'Newport Beach', state: 'California', stateCode: 'CA' },
  { city: 'San Leandro', state: 'California', stateCode: 'CA' },
  { city: 'Hawthorne', state: 'California', stateCode: 'CA' },
  { city: 'Citrus Heights', state: 'California', stateCode: 'CA' },
  { city: 'Tracy', state: 'California', stateCode: 'CA' },
  { city: 'Alhambra', state: 'California', stateCode: 'CA' },
  { city: 'Livermore', state: 'California', stateCode: 'CA' },
  { city: 'Buena Park', state: 'California', stateCode: 'CA' },
  { city: 'Menifee', state: 'California', stateCode: 'CA' },
  { city: 'Hemet', state: 'California', stateCode: 'CA' },
  { city: 'Lakewood', state: 'California', stateCode: 'CA' },
  { city: 'Merced', state: 'California', stateCode: 'CA' },
  { city: 'Chino', state: 'California', stateCode: 'CA' },
  { city: 'Newark', state: 'California', stateCode: 'CA' },
  { city: 'San Marcos', state: 'California', stateCode: 'CA' },
  { city: 'San Ramon', state: 'California', stateCode: 'CA' },
  { city: 'Cupertino', state: 'California', stateCode: 'CA' },
  { city: 'Redwood City', state: 'California', stateCode: 'CA' },
  { city: 'Yorba Linda', state: 'California', stateCode: 'CA' },
  { city: 'Madera', state: 'California', stateCode: 'CA' },
  { city: 'Chino Hills', state: 'California', stateCode: 'CA' },
  { city: 'Redondo Beach', state: 'California', stateCode: 'CA' },
  { city: 'Mountain View', state: 'California', stateCode: 'CA' },
  { city: 'Alameda', state: 'California', stateCode: 'CA' },
  { city: 'Lake Forest', state: 'California', stateCode: 'CA' },
  { city: 'Napa', state: 'California', stateCode: 'CA' },
  { city: 'Turlock', state: 'California', stateCode: 'CA' },
  { city: 'Bellflower', state: 'California', stateCode: 'CA' },
  { city: 'Palo Alto', state: 'California', stateCode: 'CA' },
  { city: 'San Mateo', state: 'California', stateCode: 'CA' },
  { city: 'Camarillo', state: 'California', stateCode: 'CA' },
  { city: 'Baldwin Park', state: 'California', stateCode: 'CA' },
  { city: 'Upland', state: 'California', stateCode: 'CA' },
  { city: 'San Luis Obispo', state: 'California', stateCode: 'CA' },
  { city: 'Folsom', state: 'California', stateCode: 'CA' },
  { city: 'Pleasanton', state: 'California', stateCode: 'CA' },
  { city: 'Union City', state: 'California', stateCode: 'CA' },
  { city: 'Apple Valley', state: 'California', stateCode: 'CA' },
  { city: 'Tulare', state: 'California', stateCode: 'CA' },
  { city: 'Rancho Cordova', state: 'California', stateCode: 'CA' },
  { city: 'Perris', state: 'California', stateCode: 'CA' },
  { city: 'Manteca', state: 'California', stateCode: 'CA' },
  { city: 'Chicago', state: 'Illinois', stateCode: 'IL' },
  { city: 'Houston', state: 'Texas', stateCode: 'TX' },
  { city: 'Phoenix', state: 'Arizona', stateCode: 'AZ' },
  { city: 'Philadelphia', state: 'Pennsylvania', stateCode: 'PA' },
  { city: 'San Antonio', state: 'Texas', stateCode: 'TX' },
  { city: 'Dallas', state: 'Texas', stateCode: 'TX' },
  { city: 'Austin', state: 'Texas', stateCode: 'TX' },
  { city: 'Jacksonville', state: 'Florida', stateCode: 'FL' },
  { city: 'Fort Worth', state: 'Texas', stateCode: 'TX' },
  { city: 'Columbus', state: 'Ohio', stateCode: 'OH' },
  { city: 'Charlotte', state: 'North Carolina', stateCode: 'NC' },
  { city: 'Indianapolis', state: 'Indiana', stateCode: 'IN' },
  { city: 'Seattle', state: 'Washington', stateCode: 'WA' },
  { city: 'Denver', state: 'Colorado', stateCode: 'CO' },
  { city: 'Washington', state: 'District of Columbia', stateCode: 'DC' },
  { city: 'Boston', state: 'Massachusetts', stateCode: 'MA' },
  { city: 'El Paso', state: 'Texas', stateCode: 'TX' },
  { city: 'Nashville', state: 'Tennessee', stateCode: 'TN' },
  { city: 'Detroit', state: 'Michigan', stateCode: 'MI' },
  { city: 'Oklahoma City', state: 'Oklahoma', stateCode: 'OK' },
  { city: 'Portland', state: 'Oregon', stateCode: 'OR' },
  { city: 'Las Vegas', state: 'Nevada', stateCode: 'NV' },
  { city: 'Memphis', state: 'Tennessee', stateCode: 'TN' },
  { city: 'Louisville', state: 'Kentucky', stateCode: 'KY' },
  { city: 'Baltimore', state: 'Maryland', stateCode: 'MD' },
  { city: 'Milwaukee', state: 'Wisconsin', stateCode: 'WI' },
  { city: 'Albuquerque', state: 'New Mexico', stateCode: 'NM' },
  { city: 'Tucson', state: 'Arizona', stateCode: 'AZ' },
  { city: 'Mesa', state: 'Arizona', stateCode: 'AZ' },
  { city: 'Kansas City', state: 'Missouri', stateCode: 'MO' },
  { city: 'Atlanta', state: 'Georgia', stateCode: 'GA' },
  { city: 'Colorado Springs', state: 'Colorado', stateCode: 'CO' },
  { city: 'Raleigh', state: 'North Carolina', stateCode: 'NC' },
  { city: 'Miami', state: 'Florida', stateCode: 'FL' },
  { city: 'Virginia Beach', state: 'Virginia', stateCode: 'VA' },
  { city: 'Omaha', state: 'Nebraska', stateCode: 'NE' },
  { city: 'Minneapolis', state: 'Minnesota', stateCode: 'MN' },
  { city: 'Tulsa', state: 'Oklahoma', stateCode: 'OK' },
  { city: 'Arlington', state: 'Texas', stateCode: 'TX' },
  { city: 'Tampa', state: 'Florida', stateCode: 'FL' },
  { city: 'New Orleans', state: 'Louisiana', stateCode: 'LA' },
];

interface CityStateOption {
  city: string;
  state: string;
  stateCode: string;
  country: string;
  countryCode: string;
}

interface CityStateInputProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  onCityStateChange?: (city: string, state: string, stateCode: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  error?: string;
}

export function CityStateInput({
  id,
  value,
  onChange,
  onCityStateChange,
  placeholder = 'Search for a city...',
  className,
  disabled = false,
  error,
}: CityStateInputProps) {
  const [suggestions, setSuggestions] = useState<CityStateOption[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Get all cities for US
  const getAllCities = useCallback((): CityStateOption[] => {
    return US_CITIES.map((city) => ({
      city: city.city,
      state: city.state,
      stateCode: city.stateCode,
      country: 'United States',
      countryCode: 'US',
    }));
  }, []);

  // Search cities based on input
  const searchCities = useCallback(
    (input: string) => {
      if (input.length < 2) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      setIsLoading(true);

      try {
        const allCities = getAllCities();
        const searchTerm = input.toLowerCase();

        const filtered = allCities
          .filter(
            (option) =>
              option.city.toLowerCase().includes(searchTerm) ||
              option.state.toLowerCase().includes(searchTerm) ||
              `${option.city}, ${option.state}`
                .toLowerCase()
                .includes(searchTerm)
          )
          .slice(0, 10); // Limit to 10 suggestions

        setSuggestions(filtered);
        setShowSuggestions(true);
      } catch (error) {
        logger.error('Error searching cities:', error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    },
    [getAllCities]
  );

  // Debounced search
  const debouncedSearch = useCallback(
    (input: string) => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      debounceRef.current = setTimeout(() => {
        searchCities(input);
      }, 300);
    },
    [searchCities]
  );

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setCurrentIndex(-1);

    // If input is empty, clear suggestions immediately
    if (newValue.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
    } else {
      setShowSuggestions(true);
      debouncedSearch(newValue);
    }
  };

  // Handle suggestion selection
  const handleSuggestionSelect = (option: CityStateOption) => {
    const displayValue = `${option.city}, ${option.state}`;
    onChange(displayValue);
    setShowSuggestions(false);
    setSuggestions([]);
    setCurrentIndex(-1);

    // Call the callback with separate city and state values
    onCityStateChange?.(option.city, option.state, option.stateCode);

    // Focus back to input
    inputRef.current?.focus();
  };

  // Handle input focus
  const handleFocus = () => {
    if (value.length >= 2) {
      setShowSuggestions(true);
    }
  };

  // Handle input blur
  const handleBlur = () => {
    // Delay hiding suggestions to allow for clicks
    setTimeout(() => {
      setShowSuggestions(false);
      setCurrentIndex(-1);
    }, 200);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setCurrentIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setCurrentIndex((prev) =>
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (currentIndex >= 0 && currentIndex < suggestions.length) {
          handleSuggestionSelect(suggestions[currentIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setCurrentIndex(-1);
        inputRef.current?.focus();
        break;
    }
  };

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        id={id}
        type="text"
        value={value}
        onChange={handleInputChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={className}
        disabled={disabled}
        error={error}
        autoComplete="off"
      />

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto"
        >
          {suggestions.map((option, index) => (
            <div
              key={`${option.city}-${option.state}`}
              className={`px-4 py-2 cursor-pointer text-sm ${
                index === currentIndex
                  ? 'bg-blue-50 text-blue-900'
                  : 'text-gray-900 hover:bg-gray-50'
              }`}
              onClick={() => handleSuggestionSelect(option)}
              onMouseEnter={() => setCurrentIndex(index)}
            >
              <div className="font-medium">{option.city}</div>
              <div className="text-gray-500 text-xs">{option.state}</div>
            </div>
          ))}
        </div>
      )}

      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        </div>
      )}
    </div>
  );
}
