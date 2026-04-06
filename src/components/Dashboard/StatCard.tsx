import React from 'react';
interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  change?: {
    value: number;
    positive: boolean;
  };
  prefix?: string;
  suffix?: string;
  position: number;
  onClick?: () => void;
  style?: React.CSSProperties;
}
const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  change,
  prefix = '',
  suffix = '',
  position,
  onClick,
  style
}) => {
  const bgColor = position % 2 === 1 ? 'bg-red-900' : 'bg-blue-950';
  return (
    <div
      className={`${bgColor} overflow-hidden shadow rounded-lg opacity-80`}
      onClick={onClick}
      style={style}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0 bg-red-50 rounded-md p-3">{icon}</div>
          <div className="ml-5 flex-1">
            <dl>
              <dt className="text-sm font-medium text-white">
                {title}
              </dt>
              <dd>
                <div className="text-lg font-medium text-white">
                  {prefix}
                  {value}
                  {suffix}
                </div>
              </dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
};
export default StatCard;