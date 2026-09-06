import ProfileForm from "./ProfileForm";
import "./Profile.css";

const Profile = () => {
  return (
    <div className="profile-page">
      <div className="profile-page-card">
        <h2>Your Profile</h2>
        <p className="profile-page-subtext">Keep your info up to date for better scholarship matches.</p>
        <ProfileForm variant="page" />
      </div>
    </div>
  );
};

export default Profile;
