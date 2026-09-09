import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { User, MapPin, Calendar, Phone, Hash, Shield } from 'lucide-react';

export default function Profile() {
  const { student } = useOutletContext();

  const details = [
    { label: "EMIS Number", value: student.emisNumber, icon: Hash },
    { label: "Admission No", value: student.admissionNumber, icon: Hash },
    { label: "Father's Name", value: student.fatherName, icon: User },
    { label: "Date of Birth", value: student.dob ? student.dob.split('-').reverse().join('-') : 'N/A', icon: Calendar },
    { label: "Mobile Number", value: student.mobileNumber, icon: Phone },
    { label: "Community", value: student.community, icon: Shield },
    { label: "Religion", value: student.religion, icon: Shield },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center overflow-hidden shadow-sm flex-shrink-0">
          {student.photoUrl ? (
            <img src={student.photoUrl} alt={student.name} className="w-full h-full object-cover" />
          ) : (
            <User className="w-8 h-8" />
          )}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Personal Profile</h1>
          <p className="text-gray-500 text-sm">Your detailed information</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 md:p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            {details.map((detail, index) => {
              const Icon = detail.icon;
              return (
                <div key={index} className="flex items-start gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center flex-shrink-0 text-gray-400">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">{detail.label}</p>
                    <p className="text-gray-900 font-semibold">{detail.value || '-'}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {student.address && (
            <div className="pt-6 border-t border-gray-100">
              <div className="flex items-start gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors">
                <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center flex-shrink-0 text-indigo-500">
                  <MapPin className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-500 mb-2">Full Address</p>
                  <p className="text-gray-900 leading-relaxed bg-gray-50/50 p-4 rounded-xl border border-gray-100 break-words">
                    {student.address}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
