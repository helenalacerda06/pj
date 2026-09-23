import './Footer.css';

function Footer() {
  return (
    <footer className="footer">

        <div className="footerDiv">

          <div className="footerDiv">
            <div className="social-icons">
              <a href="#" className="footerDi" title="Facebook" aria-label="Facebook"></a>
              <a href="#" className="icon fab fa-twitter" title="Twitter" aria-label="Twitter"></a>
              <a href="#" className="icon fab fa-linkedin-in" title="LinkedIn" aria-label="LinkedIn"></a>
              <a href="#" className="icon fab fa-instagram" title="Instagram" aria-label="Instagram"></a>
            </div>

            <div className="footer-links">
              <a href="#">Privacy Policy</a>
              <a href="#"> | Terms of Service | </a>
              <a href="#">Contact Us</a>
            </div>
          </div>
          <p className="footerDiv">&copy; 2026 Your Company. All Rights Reserved.</p>
        </div>

    </footer>
  );
}

export default Footer;
