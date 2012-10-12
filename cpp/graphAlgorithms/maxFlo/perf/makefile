IDIR = ../../../include
LDIR = ../../../lib
LIBS = ${LDIR}/lib-ga.a ${LDIR}/lib-ds.a ${LDIR}/lib-util.a
LIBGA = ${LDIR}/lib-ga.a
CXXFLAGS = -pg 

xfiles = eval1 eval3 eval4 eval5

.cpp.o:
	${CXX} ${CXXFLAGS} -I ${IDIR} -c $<

all:	${xfiles}

clean:
	rm -f *.o *.exe ${xfiles}

eval1: eval1.o ${LIBS}
	${CXX} ${CXXFLAGS} $< ${LIBS} -o $@

eval3: eval3.o ${LIBS}
	${CXX} ${CXXFLAGS} $< ${LIBS} -o $@

eval4: eval4.o ${LIBS}
	${CXX} ${CXXFLAGS} $< ${LIBS} -o $@

eval5: eval5.o ${LIBS}
	${CXX} ${CXXFLAGS} $< ${LIBS} -o $@
