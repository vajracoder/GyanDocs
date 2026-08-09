import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getSubjects } from '../../services/api.js'
import './Footer.css'

export default function Footer() {
  const year = new Date().getFullYear()
  const [subjects, setSubjects] = useState([])

  useEffect(() => {
    getSubjects().then(setSubjects).catch(() => setSubjects([]))
  }, [])

  return (
    <footer className="ev-footer">
      <div className="container ev-footer__inner">
        <div className="ev-footer__brand">
          <Link to="/" className="ev-footer__logo"><span className="ev-footer__mark" aria-hidden="true">GD</span><span>GyanDoc</span></Link>
          <p className="ev-footer__tagline">Every question that's ever been asked, organized by subject and unit — so you study what actually shows up on the paper.</p>
        </div>
        <div className="ev-footer__col">
          <h4 className="ev-footer__heading">Subjects</h4>
          <ul className="ev-footer__list">{subjects.slice(0, 5).map((subject) => <li key={subject._id || subject.id}><Link to={`/subjects/${subject.slug}`}>{subject.name}</Link></li>)}</ul>
        </div>
        <div className="ev-footer__col">
          <h4 className="ev-footer__heading">Product</h4>
          <ul className="ev-footer__list"><li><Link to="/subjects">Browse subjects</Link></li><li><Link to="/search">Search questions</Link></li><li><Link to="/results?q=Unit%203">Unit-wise PYQs</Link></li></ul>
        </div>
        <div className="ev-footer__col">
          <h4 className="ev-footer__heading">Company</h4>
          <ul className="ev-footer__list"><li><span className="ev-footer__soon">About</span></li><li><span className="ev-footer__soon">Contact</span></li><li><span className="ev-footer__soon">Contribute PYQs</span></li></ul>
        </div>
      </div>
      <div className="container ev-footer__bottom"><p>© {year} GyanDoc. Built for engineering students.</p><p className="ev-footer__note">Phase 1 prototype — content shown is sample data.</p></div>
    </footer>
  )
}
