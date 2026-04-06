import React from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XIcon } from 'lucide-react';
import { RequestData } from '../../services/requestService';
import { Team } from '../../services/teamService';

interface TeamDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: RequestData;
  team: Team | null;
}

const TeamDetailsModal: React.FC<TeamDetailsModalProps> = ({
  isOpen,
  onClose,
  request,
  team
}) => {
  return (
    <Transition appear show={isOpen} as={React.Fragment}>
      <Dialog as="div" className="relative z-10" onClose={onClose}>
        <Transition.Child
          as={React.Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={React.Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title
                  as="div"
                  className="flex items-center justify-between mb-4"
                >
                  <h3 className="text-lg font-medium leading-6 text-gray-900">
                    Request Details
                  </h3>
                  <button
                    type="button"
                    className="text-gray-400 hover:text-gray-500"
                    onClick={onClose}
                  >
                    <XIcon className="h-6 w-6" />
                  </button>
                </Dialog.Title>

                <div className="mt-4">
                  <div className="bg-gray-50 p-4 rounded-lg mb-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Request Information</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Pickup Location</p>
                        <p className="text-sm font-medium">{request.pickupLocation}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Delivery Location</p>
                        <p className="text-sm font-medium">{request.deliveryLocation}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Pickup Date</p>
                        <p className="text-sm font-medium">
                          {new Date(request.pickupDate).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Priority</p>
                        <p className="text-sm font-medium capitalize">{request.priority}</p>
                      </div>
                    </div>
                  </div>

                  {team ? (
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Assigned Team</h4>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm font-medium mb-4">{team.name}</p>
                        <div className="space-y-4">
                          {team.members.map((member) => (
                            <div key={member.id} className="flex items-center space-x-3">
                              {member.photo_url && (
                                <img
                                  src={member.photo_url}
                                  alt={member.name}
                                  className="h-10 w-10 rounded-full object-cover"
                                />
                              )}
                              <div>
                                <p className="text-sm font-medium">{member.name}</p>
                                <p className="text-sm text-gray-500">{member.role}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-500">
                      No team has been assigned to this request yet.
                    </div>
                  )}
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    onClick={onClose}
                    className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                  >
                    Close
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default TeamDetailsModal; 